import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import Blog from "../models/Blog.model";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

describe("Blog listing and categories", () => {
  async function makeAuthor() {
    return User.create({ name: "Editorial Author", email: "editorial@test.com", password: "password123", role: "admin" });
  }

  it("filters by category, excludes content, and includes a derived readingTime", async () => {
    const author = await makeAuthor();
    const longContent = "word ".repeat(450); // 450 words / 200wpm = 2.25 -> rounds to 2

    await Blog.create({
      title: "Parent Safety Guide",
      slug: "parent-safety-guide",
      content: longContent,
      excerpt: "A guide for parents.",
      author: author._id,
      category: "Parents",
      featured: true,
      isPublished: true,
    });
    await Blog.create({
      title: "Pricing Explainer",
      slug: "pricing-explainer",
      content: "Short content here.",
      excerpt: "How pricing works.",
      author: author._id,
      category: "Pricing",
      isPublished: true,
    });

    const parentsRes = await request(app).get("/api/v1/blogs?category=Parents").expect(200);
    expect(parentsRes.body.total).toBe(1);
    expect(parentsRes.body.blogs[0].slug).toBe("parent-safety-guide");
    expect(parentsRes.body.blogs[0].content).toBeUndefined();
    expect(parentsRes.body.blogs[0].readingTime).toBe("2 min read");
    expect(parentsRes.body.blogs[0].featured).toBe(true);

    const featuredRes = await request(app).get("/api/v1/blogs?featured=true").expect(200);
    expect(featuredRes.body.total).toBe(1);
    expect(featuredRes.body.blogs[0].slug).toBe("parent-safety-guide");
  });

  it("returns distinct categories with published post counts", async () => {
    const author = await makeAuthor();
    await Blog.create([
      { title: "A", slug: "a", content: "content a", excerpt: "e", author: author._id, category: "Safety", isPublished: true },
      { title: "B", slug: "b", content: "content b", excerpt: "e", author: author._id, category: "Safety", isPublished: true },
      { title: "C", slug: "c", content: "content c", excerpt: "e", author: author._id, category: "Pricing", isPublished: true },
      { title: "Draft", slug: "draft", content: "content d", excerpt: "e", author: author._id, category: "Safety", isPublished: false },
    ]);

    const res = await request(app).get("/api/v1/blogs/categories").expect(200);
    const safety = res.body.categories.find((c: { category: string }) => c.category === "Safety");
    expect(safety.count).toBe(2); // the unpublished draft must not be counted
  });

  it("buckets legacy posts with no stored category under 'Guides' instead of null", async () => {
    // Simulates a post published before the category field existed - Mongoose
    // schema defaults only apply to new documents, so a raw insert with the
    // field omitted reproduces a real legacy document (this crashed
    // categoryToSlug(null) on the frontend before the $ifNull fix).
    const author = await makeAuthor();
    await Blog.collection.insertOne({
      title: "Legacy Post", slug: "legacy-post", content: "content", excerpt: "e",
      author: author._id, isPublished: true, tags: [], featured: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const categoriesRes = await request(app).get("/api/v1/blogs/categories").expect(200);
    expect(categoriesRes.body.categories.some((c: { category: string | null }) => c.category === null)).toBe(false);
    const guides = categoriesRes.body.categories.find((c: { category: string }) => c.category === "Guides");
    expect(guides?.count).toBeGreaterThanOrEqual(1);

    const listRes = await request(app).get("/api/v1/blogs?category=Guides").expect(200);
    expect(listRes.body.blogs.some((b: { slug: string }) => b.slug === "legacy-post")).toBe(true);
  });

  it("single-post endpoint still returns full content plus readingTime", async () => {
    const author = await makeAuthor();
    await Blog.create({
      title: "Full Post",
      slug: "full-post",
      content: "word ".repeat(200),
      excerpt: "e",
      author: author._id,
      category: "Guides",
      isPublished: true,
    });

    const res = await request(app).get("/api/v1/blogs/full-post").expect(200);
    expect(res.body.blog.content).toContain("word");
    expect(res.body.blog.readingTime).toBe("1 min read");
  });

  it("doesn't crash on garbage pagination params and caps an oversized limit", async () => {
    const author = await makeAuthor();
    await Blog.create({ title: "P", slug: "p-pagination", content: "content", excerpt: "e", author: author._id, isPublished: true });

    // ?page=abc&limit=xyz used to reach Mongoose as NaN/NaN before the fix.
    const garbage = await request(app).get("/api/v1/blogs?page=abc&limit=xyz").expect(200);
    expect(garbage.body.page).toBe(1);

    const oversized = await request(app).get("/api/v1/blogs?limit=999999").expect(200);
    expect(oversized.body.blogs.length).toBeLessThanOrEqual(200);
  });
});
