import mongoose, { Model, Schema, models } from "mongoose";
import type { IMessage } from "@/types/message";

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    clientId: { type: String },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, senderId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, read: 1 });

const Message =
  (models.Message as Model<IMessage> | undefined) ??
  mongoose.model<IMessage>("Message", messageSchema);

export default Message;
