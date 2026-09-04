import { Types } from "mongoose";
import { IComment } from "./comment";

export interface IPost {
  body?: string;
  images?: string[];
  authorId: string;
  authorName: string;
  authorUsername?: string;
  likes: Types.ObjectId[];
  comments: IComment[];
}
