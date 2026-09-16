import webpush from "web-push";
import connectMongoDB from "@/lib/mongodb";
import PushSubscription from "@/models/pushSubscription";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendPushNotificationToUser(
  userId: string | { toString(): string } | null | undefined,
  payload: PushPayload,
): Promise<void> {
  const recipient = userId?.toString?.();
  if (!recipient || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  await connectMongoDB();
  const subscriptions = await PushSubscription.find({ userId: recipient }).lean();
  if (subscriptions.length === 0) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          message,
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
        } else {
          console.error("Push notification failed:", error);
        }
      }
    }),
  );
}
