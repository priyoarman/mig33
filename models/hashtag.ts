import mongoose, { Model, Schema, models } from "mongoose";

export interface IHashtag {
  tag: string;
  count: number;
}

const hashtagSchema = new Schema<IHashtag>(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Hashtag =
  (models.Hashtag as Model<IHashtag> | undefined) ??
  mongoose.model<IHashtag>("Hashtag", hashtagSchema);

export default Hashtag;
