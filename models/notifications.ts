import mongoose, { Model, Schema, Types, models } from "mongoose";

export interface INotification {
  recipientId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "like" | "comment" | "follow";
  message: string;
  postId?: Types.ObjectId;
  read: boolean;
}

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