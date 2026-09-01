import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
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
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
