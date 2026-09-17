import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { existsSync, readFileSync } from "fs";
import { networkInterfaces } from "os";
import { join } from "path";
import next from "next";
import { Server, type Socket } from "socket.io";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import connectMongoDB from "@/lib/mongodb";
import Message from "@/models/messages";
import { sendPushNotificationToUser } from "@/lib/webpush";

interface AuthedSocket extends Socket {
  userId?: string;
}

interface SendMessagePayload {
  recipientId?: string;
  content?: string;
  clientId?: string;
}

interface SendMessageAck {
  (response: { error: string } | { message: Record<string, unknown> }): void;
}

const tlsKeyPath = join(import.meta.dirname, "certs", "dev-key.pem");
const tlsCertPath = join(import.meta.dirname, "certs", "dev-cert.pem");
const tlsCredentials =
  process.env.LOCAL_HTTPS === "true" &&
  existsSync(tlsKeyPath) &&
  existsSync(tlsCertPath)
    ? { key: readFileSync(tlsKeyPath), cert: readFileSync(tlsCertPath) }
    : null;

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

process.env.AUTH_TRUST_HOST = "true";

const getLanAddresses = (): string[] =>
  Object.values(networkInterfaces())
    .flat()
    .filter(
      (iface): iface is NonNullable<typeof iface> =>
        iface != null && iface.family === "IPv4" && !iface.internal,
    )
    .map((iface) => iface.address);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const parseCookieHeader = (cookieHeader = ""): Record<string, string> => {
  const cookies: Record<string, string> = {};
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

  io.use(async (socket: AuthedSocket, nextMiddleware) => {
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
        } as Parameters<typeof getToken>[0]["req"],
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

  io.on("connection", (socket: AuthedSocket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    socket.on(
      "send_message",
      async (payload: SendMessagePayload, acknowledge?: SendMessageAck) => {
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
          await connectMongoDB();
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
            title: (sender?.name as string | undefined) || "New message",
            body: `Message: ${content}`,
            url: `/messages?userId=${userId}`,
          });
        } catch (error) {
          console.error("Send message error:", error);
          acknowledge?.({ error: "Message could not be sent" });
        }
      },
    );
  });

  httpServer.listen(port, hostname, () => {
    const protocol = tlsCredentials ? "https" : "http";
    console.log(`> Local:   ${protocol}://localhost:${port}`);
    for (const address of getLanAddresses()) {
      console.log(`> Network: ${protocol}://${address}:${port}`);
    }
  });
});
