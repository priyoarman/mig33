import mongoose, { Model, Schema, models } from "mongoose";
import type { INotification } from "@/types/notification";

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },
    message: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification =
  (models.Notification as Model<INotification> | undefined) ??
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;