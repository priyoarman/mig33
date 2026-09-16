import mongoose, { Model, Schema, models } from "mongoose";
import type { IPushSubscription } from "@/types/pushSubscription";

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ userId: 1 });

const PushSubscription =
  (models.PushSubscription as Model<IPushSubscription> | undefined) ??
  mongoose.model<IPushSubscription>("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
