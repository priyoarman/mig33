import { Types } from "mongoose";

export interface IComment {
  user: Types.ObjectId;
  username: string;
  // Not declared on CommentSchema (silently dropped on save), but the API
  // routes write and read it back as a best-effort fallback.
  email?: string;
  body: string;
  mentions?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}
