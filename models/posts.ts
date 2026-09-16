import mongoose, { Model, Schema, models } from "mongoose";
import type { IComment } from "@/types/comment";
import type { IPost } from "@/types/post";

const CommentSchema = new Schema<IComment>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    body: { type: String, required: true },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

const postsSchema = new Schema<IPost>(
  {
    body: {
      type: String,
      required: function () {
        return !this.repostOf && (!this.images || this.images.length === 0);
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
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
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

postsSchema.index({ repostOf: 1 });

const Post =
  (models.Post as Model<IPost> | undefined) ??
  mongoose.model<IPost>("Post", postsSchema);

export default Post;
