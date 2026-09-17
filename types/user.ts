import { Types } from "mongoose";

export interface ISearchHistory {
  query: string;
  type?: "post" | "user" | "all";
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
  following: Types.Array<Types.ObjectId>;
  followers: Types.Array<Types.ObjectId>;
  searchHistory: ISearchHistory[];
  createdAt: Date;
  updatedAt: Date;
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
