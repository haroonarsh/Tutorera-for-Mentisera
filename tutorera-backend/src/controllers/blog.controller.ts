import { Response, Request } from "express";
import { AuthRequest } from "../types";
import Blog from "../models/Blog.model";

// @desc    Create blog post
// @route   POST /api/blogs
// @access  Private (admin)
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, slug, content, excerpt, coverImage, tags } = req.body;

  const existing = await Blog.findOne({ slug });
  if (existing) {
    res.status(400).json({ success: false, message: "Slug already exists" });
    return;
  }

  const blog = await Blog.create({
    title, slug, content, excerpt,
    coverImage, tags,
    author: req.user?._id,
  });

  res.status(201).json({ success: true, message: "Blog post created", blog });
};

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
export const getAllBlogs = async (req: Request, res: Response): Promise<void> => {
  const { page = "1", limit = "9", tag } = req.query;
  const filter: Record<string, unknown> = { isPublished: true };
  if (tag) filter.tags = { $in: [tag] };

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate("author", "name avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum)
    .select("-content");

  res.status(200).json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), blogs });
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

  res.status(200).json({ success: true, blog });
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