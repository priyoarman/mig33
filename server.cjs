const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { getToken } = require("next-auth/jwt");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

process.env.AUTH_TRUST_HOST = "true";

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
  },
  { timestamps: true },
);
const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
let databaseConnection;
const connectDatabase = () => {
  databaseConnection ||= mongoose.connect(process.env.MONGODB_URI);
  return databaseConnection;
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
  const httpServer = createServer((request, response) =>
    handle(request, response),
  );
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
        });
        const serialized = {
          _id: message._id.toString(),
          senderId: userId,
          recipientId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        };
        io.to(`user:${recipientId}`).emit("message", serialized);
        acknowledge?.({ message: serialized });
      } catch (error) {
        console.error("Send message error:", error);
        acknowledge?.({ error: "Message could not be sent" });
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
