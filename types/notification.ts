import { Types } from "mongoose";

export interface INotification {
  recipientId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "like" | "comment" | "follow";
  message: string;
  postId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
