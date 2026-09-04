import mongoose, { Model, Schema, models } from "mongoose";
import type { IComment } from "@/types/comment";
import type { IPost } from "@/types/post";

const CommentSchema = new Schema<IComment>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

const postsSchema = new Schema<IPost>(
  {
    body: {
      type: String,
      required: function () {
        return !this.images || this.images.length === 0;
      },
    },
    images: [
      {
        type: String,
      },
    ],
    authorId: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorUsername: {
      type: String,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: {
      type: [CommentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postsSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

postsSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

const Post =
  (models.Post as Model<IPost> | undefined) ??
  mongoose.model<IPost>("Post", postsSchema);

export default Post;
