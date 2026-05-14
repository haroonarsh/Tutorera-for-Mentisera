import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  author: Types.ObjectId;
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true, trim: true },
    coverImage: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String, trim: true }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBlog>("Blog", blogSchema);