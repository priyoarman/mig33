import { Types } from "mongoose";

export interface IMessage {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  content: string;
  clientId?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
