import mongoose, { Model, Schema, Types, models } from "mongoose";

interface ISearchHistory {
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

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    profileImage: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    website: {
      type: String,
    },
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    searchHistory: [
      {
        query: String,
        type: {
          type: String,
          enum: ["post", "user"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const User =
  (models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", userSchema);

export default User;
