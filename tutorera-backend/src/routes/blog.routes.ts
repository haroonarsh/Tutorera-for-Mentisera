import { Router } from "express";
import { createBlog, getAllBlogs, getBlogBySlug, getBlogCategories, updateBlog, deleteBlog } from "../controllers/blog.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { cachePublic } from "../middlewares/cacheControl.middleware";

const router = Router();

// Published blog content changes rarely enough that a short public cache
// meaningfully cuts DB load without risking stale content for long - 5 min
// direct, up to 25 min stale-while-revalidate for anything fronting this.
router.get("/", cachePublic(300), getAllBlogs);
router.get("/categories", cachePublic(300), getBlogCategories);
router.get("/:slug", cachePublic(300), getBlogBySlug);
router.post("/", protect, authorize("admin"), createBlog);
router.put("/:id", protect, authorize("admin"), updateBlog);
router.delete("/:id", protect, authorize("admin"), deleteBlog);

export default router;