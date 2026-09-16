import { Router } from "express";
import { createBlog, getAllBlogs, getBlogBySlug, getBlogCategories, updateBlog, deleteBlog } from "../controllers/blog.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllBlogs);
router.get("/categories", getBlogCategories);
router.get("/:slug", getBlogBySlug);
router.post("/", protect, authorize("admin"), createBlog);
router.put("/:id", protect, authorize("admin"), updateBlog);
router.delete("/:id", protect, authorize("admin"), deleteBlog);

export default router;