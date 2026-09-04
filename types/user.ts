import { Types } from "mongoose";

export interface ISearchHistory {
  query: string;
  type?: "post" | "user";
  createdAt: Date;
}

export interface IUser {
  name: string;
  email: string;
  username: string;
  password?: string;
  profileImage?: string | null;
  coverImage?: string | null;
  bio?: string;
  location?: string;
  website?: string;
  following: Types.ObjectId[];
  followers: Types.ObjectId[];
  searchHistory: ISearchHistory[];
}

export interface UserProfile {
  _id?: string;
  id?: string;
  name: string;
  username: string;
  bio?: string;
  website?: string;
  profileImage?: string | null;
  coverImage?: string | null;
}
