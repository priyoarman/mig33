import mongoose, { Model, Schema, Types, models } from "mongoose";

export interface IMessage {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  content: string;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, senderId: 1, createdAt: 1 });

const Message =
  (models.Message as Model<IMessage> | undefined) ??
  mongoose.model<IMessage>("Message", messageSchema);

export default Message;
