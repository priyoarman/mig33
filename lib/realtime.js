import Notification from "@/models/notifications";

export function emitNotification(recipientId, notification) {
  const io = globalThis.__redilinkIo;
  const recipientRoom = recipientId?.toString?.();
  if (!io || !recipientRoom) return;

  io.to(`user:${recipientRoom}`).emit("notification", {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...notification,
  });
}

export async function createAndEmitNotification(recipientId, notification) {
  const recipient = recipientId?.toString?.();
  const actorId = notification.actorId?.toString?.();
  if (!recipient || !actorId) return;

  const saved = await Notification.create({
    recipientId: recipient,
    actorId,
    type: notification.type,
    message: notification.message,
    postId: notification.postId,
  });

  emitNotification(recipient, {
    ...notification,
    id: saved._id.toString(),
    createdAt: saved.createdAt.toISOString(),
  });
}
