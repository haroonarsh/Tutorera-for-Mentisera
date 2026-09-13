import { Response, Request } from "express";
import { AuthRequest } from "../types";
import Blog from "../models/Blog.model";

// @desc    Create blog post
// @route   POST /api/blogs
// @access  Private (admin)
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, slug, content, excerpt, metaDescription, coverImage, coverImageAlt, tags, category, featured } = req.body;

  const existing = await Blog.findOne({ slug });
  if (existing) {
    res.status(400).json({ success: false, message: "Slug already exists" });
    return;
  }

  const blog = await Blog.create({
    title, slug, content, excerpt, metaDescription,
    coverImage, coverImageAlt, tags, category, featured,
    author: req.user?._id,
  });

  res.status(201).json({ success: true, message: "Blog post created", blog });
};

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
const WORDS_PER_MINUTE = 200;

export const getAllBlogs = async (req: Request, res: Response): Promise<void> => {
  const { page = "1", limit = "9", tag, category, featured } = req.query;
  const filter: Record<string, unknown> = { isPublished: true };
  if (tag) filter.tags = { $in: [tag] };
  // "Guides" is both the schema default for new posts AND how the categories
  // aggregation buckets legacy posts with no stored category (see $ifNull
  // above) - matching only category:"Guides" would miss those legacy posts,
  // since a genuinely absent field never equals a string value in MongoDB.
  if (category === "Guides") filter.$or = [{ category: "Guides" }, { category: { $exists: false } }, { category: null }];
  else if (category) filter.category = category;
  if (featured === "true") filter.featured = true;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate("author", "name avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  // Reading time is derived from content length, then content itself is dropped
  // from the response - the index page never needs full post bodies, only the
  // single-post endpoint (getBlogBySlug) does.
  const withReadingTime = blogs.map((blog) => {
    const wordCount = blog.content.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = `${Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))} min read`;
    const obj = blog.toObject() as unknown as Record<string, unknown>;
    delete obj.content;
    return { ...obj, readingTime };
  });

  res.status(200).json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), blogs: withReadingTime });
};

// @desc    Get distinct categories with published post counts
// @route   GET /api/blogs/categories
// @access  Public
export const getBlogCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await Blog.aggregate([
    { $match: { isPublished: true } },
    // Posts published before the category field existed have no value stored
    // (a Mongoose schema default only applies to new documents, never
    // retroactively) - $ifNull buckets those under "Guides" instead of
    // grouping them under a null id, which would otherwise crash any
    // consumer that slugifies the category name.
    { $group: { _id: { $ifNull: ["$category", "Guides"] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    categories: categories.map((c) => ({ category: c._id, count: c.count })),
  });
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
    .populate("author", "name avatar");

  if (!blog) {
    res.status(404).json({ success: false, message: "Blog post not found" });
    return;
  }

  const wordCount = blog.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = `${Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))} min read`;

  res.status(200).json({ success: true, blog: { ...blog.toObject(), readingTime } });
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (admin)
export const updateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );

  if (!blog) {
    res.status(404).json({ success: false, message: "Blog not found" });
    return;
  }

  res.status(200).json({ success: true, message: "Blog updated", blog });
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (admin)
export const deleteBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    res.status(404).json({ success: false, message: "Blog not found" });
    return;
  }
  res.status(200).json({ success: true, message: "Blog deleted" });
};