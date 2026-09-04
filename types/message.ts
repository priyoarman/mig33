import { Types } from "mongoose";

export interface IMessage {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  content: string;
}
