import mongoose, { Schema, models } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, senderId: 1, createdAt: 1 });

const Message = models.Message || mongoose.model("Message", messageSchema);

export default Message;
