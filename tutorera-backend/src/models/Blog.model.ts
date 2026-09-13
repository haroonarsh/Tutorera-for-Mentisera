import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaDescription?: string;
  coverImage: string;
  coverImageAlt?: string;
  author: Types.ObjectId;
  tags: string[];
  category: string;
  featured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// canonical_url and reading_time from the original brief are deliberately NOT
// stored fields - both are cheaply derived (from slug, and from content length
// at ~200wpm) and storing them risks going stale if a post is edited or moved.
const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true, trim: true },
    // Falls back to excerpt when empty - most posts won't need a distinct SEO description.
    metaDescription: { type: String, trim: true, default: "" },
    coverImage: { type: String, default: "" },
    coverImageAlt: { type: String, trim: true, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String, trim: true }],
    category: { type: String, trim: true, default: "Guides", index: true },
    featured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBlog>("Blog", blogSchema);