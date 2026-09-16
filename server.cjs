const { createServer: createHttpServer } = require("http");
const { createServer: createHttpsServer } = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const next = require("next");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { getToken } = require("next-auth/jwt");
const webpush = require("web-push");

const tlsKeyPath = path.join(__dirname, "certs", "dev-key.pem");
const tlsCertPath = path.join(__dirname, "certs", "dev-cert.pem");
const tlsCredentials =
  process.env.LOCAL_HTTPS === "true" &&
  fs.existsSync(tlsKeyPath) &&
  fs.existsSync(tlsCertPath)
    ? { key: fs.readFileSync(tlsKeyPath), cert: fs.readFileSync(tlsCertPath) }
    : null;

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

process.env.AUTH_TRUST_HOST = "true";

const getLanAddresses = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface.address);

const resolveRequestOrigin = (request) => {
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  if (!host) return null;
  const protocol =
    request.headers["x-forwarded-proto"]?.split(",")[0]?.trim() ||
    (dev ? "http" : "https");
  return `${protocol}://${host}`;
};
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    clientId: { type: String },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true },
);
const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String },
  },
  { timestamps: true },
);
const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", pushSubscriptionSchema);
let databaseConnection;
const connectDatabase = () => {
  databaseConnection ||= mongoose.connect(process.env.MONGODB_URI);
  return databaseConnection;
};

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;
if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const sendPushNotificationToUser = async (userId, payload) => {
  if (!userId || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;
  try {
    await connectDatabase();
    const subscriptions = await PushSubscription.find({ userId }).lean();
    const message = JSON.stringify(payload);
    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            { endpoint: subscription.endpoint, keys: subscription.keys },
            message,
          );
        } catch (error) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: subscription._id });
          } else {
            console.error("Push notification failed:", error);
          }
        }
      }),
    );
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
};

const parseCookieHeader = (cookieHeader = "") => {
  const cookies = {};
  cookieHeader.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const name = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    cookies[name] = decodeURIComponent(value);
  });
  return cookies;
};

app.prepare().then(() => {
  const httpServer = tlsCredentials
    ? createHttpsServer(tlsCredentials, (request, response) =>
        handle(request, response),
      )
    : createHttpServer((request, response) => handle(request, response));
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  globalThis.__redilinkIo = io;

  io.use(async (socket, nextMiddleware) => {
    try {
      const cookieHeader = socket.request.headers.cookie || "";
      const usesSecureCookie = cookieHeader.includes(
        "__Secure-next-auth.session-token=",
      );
      const cookieName = usesSecureCookie
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";
      const token = await getToken({
        req: {
          headers: socket.request.headers,
          cookies: parseCookieHeader(cookieHeader),
        },
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: usesSecureCookie,
        cookieName,
      });
      if (!token?.id) return nextMiddleware(new Error("Unauthorized"));
      socket.userId = token.id;
      nextMiddleware();
    } catch (error) {
      console.error("Socket authentication error:", error);
      nextMiddleware(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    socket.on("send_message", async (payload, acknowledge) => {
      const recipientId = payload?.recipientId?.toString();
      const content = payload?.content?.trim();
      const clientId =
        typeof payload?.clientId === "string"
          ? payload.clientId.slice(0, 100)
          : undefined;
      if (
        !userId ||
        !recipientId ||
        !content ||
        content.length > 2000 ||
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(recipientId)
      ) {
        acknowledge?.({ error: "A valid recipient and message are required" });
        return;
      }
      try {
        await connectDatabase();
        const message = await Message.create({
          senderId: userId,
          recipientId,
          content,
          clientId,
        });
        const serialized = {
          _id: message._id.toString(),
          senderId: userId,
          recipientId,
          content: message.content,
          clientId: message.clientId,
          read: false,
          createdAt: message.createdAt.toISOString(),
        };
        io.to(`user:${recipientId}`).emit("message", serialized);
        acknowledge?.({ message: serialized });

        const sender = await mongoose.connection
          .collection("users")
          .findOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { projection: { name: 1 } },
          );
        sendPushNotificationToUser(recipientId, {
          title: sender?.name ? `New message from ${sender.name}` : "New message",
          body: content,
          url: `/messages?userId=${userId}`,
        });
      } catch (error) {
        console.error("Send message error:", error);
        acknowledge?.({ error: "Message could not be sent" });
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    const protocol = tlsCredentials ? "https" : "http";
    console.log(`> Local:   ${protocol}://localhost:${port}`);
    for (const address of getLanAddresses()) {
      console.log(`> Network: ${protocol}://${address}:${port}`);
    }
  });
});
