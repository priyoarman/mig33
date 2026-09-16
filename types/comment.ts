import { Types } from "mongoose";

export interface IComment {
  user: Types.ObjectId;
  username: string;
  body: string;
  mentions?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}
