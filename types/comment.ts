import { Types } from "mongoose";

export interface IComment {
  user: Types.ObjectId;
  username: string;
  body: string;
}
