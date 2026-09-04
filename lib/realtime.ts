import Notification from "@/models/notifications";
import type { INotification } from "@/types/notification";

type NotificationType = INotification["type"];

interface NotificationActor {
  name: string;
  username?: string | null;
}

interface RealtimeNotificationInput {
  type: NotificationType;
  message: string;
  actorId: string;
  postId?: string;
  actor?: NotificationActor;
  id?: string;
  createdAt?: string;
}

interface RoomSocket {
  emit(eventName: string, payload: Record<string, unknown>): void;
}

declare global {
  var __redilinkIo: {
    to(room: string): RoomSocket;
  } | undefined;
}

export function emitNotification(
  recipientId: string | { toString(): string } | null | undefined,
  notification: RealtimeNotificationInput,
): void {
  const io = globalThis.__redilinkIo;
  const recipientRoom = recipientId?.toString?.();
  if (!io || !recipientRoom) return;

  io.to(`user:${recipientRoom}`).emit("notification", {
    id: notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: notification.createdAt ?? new Date().toISOString(),
    ...notification,
  });
}

export async function createAndEmitNotification(
  recipientId: string | { toString(): string } | null | undefined,
  notification: RealtimeNotificationInput,
): Promise<void> {
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
