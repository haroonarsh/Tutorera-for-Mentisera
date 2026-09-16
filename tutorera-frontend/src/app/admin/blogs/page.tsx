"use client";
import { UI_COLORS, STATUS_COLORS } from "@/lib/brand";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import { Plus, Edit, Trash2, Eye, Upload, X, Image as ImageIcon } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import InfoTooltip from "@/components/admin/InfoTooltip";

const C = UI_COLORS;

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category?: string;
  featured?: boolean;
  isPublished: boolean;
  createdAt: string;
  author: { name: string };
}

const emptyForm = { title: '', slug: '', excerpt: '', metaDescription: '', content: '', tags: [] as string[], category: 'Guides', featured: false, coverImage: '', coverImageAlt: '' };

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const fetchBlogs = async () => {
    try {
      const res = await api.get('/blogs?limit=50');
      setBlogs(res.data.blogs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/blogs/categories');
      setCategories((res.data.categories || []).map((c: { category: string }) => c.category));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBlogs(); fetchCategories(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.excerpt) {
      showError("Please fill title, excerpt and content");
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: form.title,
        slug: form.slug || generateSlug(form.title),
        excerpt: form.excerpt,
        metaDescription: form.metaDescription,
        content: form.content,
        tags: form.tags,
        category: form.category || 'Guides',
        featured: form.featured,
        coverImage: form.coverImage,
        coverImageAlt: form.coverImageAlt,
        isPublished: true,
      };
      if (editBlog) {
        await api.put(`/blogs/${editBlog._id}`, data);
      } else {
        await api.post('/blogs', data);
      }
      setShowForm(false);
      setEditBlog(null);
      setForm(emptyForm);
      fetchBlogs();
      fetchCategories();
      showSuccess(editBlog ? 'Blog post updated successfully.' : 'Blog post created successfully.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showError(e.response?.data?.message || 'Failed to save blog');
    } finally { setSaving(false); }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('coverImage', file);
      const res = await api.post('/upload/blog-cover', formData);
      setForm(f => ({ ...f, coverImage: res.data.url }));
      showSuccess('Cover image uploaded.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showError(e.response?.data?.message || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value || form.tags.includes(value)) return;
    setForm(f => ({ ...f, tags: [...f.tags, value] }));
  };
  const removeTag = (value: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== value) }));

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      await api.delete(`/blogs/${id}`);
      fetchBlogs();
      showSuccess('Blog post deleted successfully.');
    } catch { showError('Failed to delete blog post.'); }
  };

  const handleEdit = async (blog: Blog) => {
    // The list endpoint never includes content (or a reliable tags array), so the
    // full post must be fetched by slug first - otherwise saving this form back
    // would silently wipe the post's content and tags.
    setEditBlog(blog);
    setShowForm(true);
    setLoadingEdit(true);
    setAddingCategory(false);
    setNewCategoryInput('');
    setTagInput('');
    try {
      const res = await api.get(`/blogs/${blog.slug}`);
      const full = res.data.blog;
      setForm({
        title: full.title,
        slug: full.slug,
        excerpt: full.excerpt,
        metaDescription: full.metaDescription || '',
        content: full.content,
        tags: full.tags || [],
        category: full.category || 'Guides',
        featured: Boolean(full.featured),
        coverImage: full.coverImage || '',
        coverImageAlt: full.coverImageAlt || '',
      });
    } catch {
      showError('Failed to load full post for editing.');
      setShowForm(false);
      setEditBlog(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Blog Posts</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Manage blog content for TUTORERA®</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditBlog(null); setForm(emptyForm); setAddingCategory(false); setNewCategoryInput(''); setTagInput(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: C.accent, color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ backgroundColor: C.surface, borderRadius: '0.875rem', padding: '2rem', border: `1px solid ${C.border}`, marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: '700', color: C.primary, marginBottom: '1.5rem' }}>
            {editBlog ? 'Edit Blog Post' : 'New Blog Post'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Title *</label>
              <input value={form.title} onChange={e => {
                setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) });
              }}
                placeholder="Blog post title"
                style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Slug (URL)</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated-from-title"
                style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.gray500 }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Excerpt * (short description)</label>
              <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
                rows={2} placeholder="Brief description shown in blog listing..."
                style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Meta Description (SEO, optional)</label>
              <textarea value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                rows={2} placeholder="Falls back to the excerpt above if left blank"
                style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Category</label>
                {addingCategory ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      autoFocus
                      value={newCategoryInput}
                      onChange={e => setNewCategoryInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = newCategoryInput.trim();
                          if (value) { setForm({ ...form, category: value }); setAddingCategory(false); setNewCategoryInput(''); }
                        }
                      }}
                      placeholder="New category name"
                      style={{ flex: 1, padding: '0.75rem 1rem', border: `1.5px solid ${C.accent}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = newCategoryInput.trim();
                        if (value) { setForm({ ...form, category: value }); setAddingCategory(false); setNewCategoryInput(''); }
                      }}
                      style={{ padding: '0 1rem', background: C.accent, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingCategory(false); setNewCategoryInput(''); }}
                      style={{ padding: '0 0.75rem', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', cursor: 'pointer', color: C.gray500 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={categories.includes(form.category) ? form.category : ''}
                    onChange={e => {
                      if (e.target.value === '__add_new__') { setAddingCategory(true); return; }
                      setForm({ ...form, category: e.target.value });
                    }}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                  >
                    {!categories.includes(form.category) && form.category && (
                      <option value="">{form.category} (new)</option>
                    )}
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__add_new__">+ Add new category…</option>
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: C.primary, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                  Featured
                </label>
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
                Cover Image
                <InfoTooltip text="Recommended 1200×630px (1.91:1 ratio) so the image crops cleanly for social sharing and the blog card. JPG, PNG or WebP, up to 5MB." />
              </label>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (file) handleCoverUpload(file); e.target.value = ''; }}
              />
              {form.coverImage ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 160, height: 84, borderRadius: '0.5rem', overflow: 'hidden', border: `1.5px solid ${C.border}`, flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt={form.coverImageAlt || 'Cover preview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', border: `1.5px solid ${C.accent}`, borderRadius: '0.4rem', background: 'white', cursor: 'pointer', color: C.accent, fontSize: '0.8rem', fontWeight: '600' }}>
                        <Upload size={14} /> {uploadingCover ? 'Uploading…' : 'Replace'}
                      </button>
                      <button type="button" onClick={() => setForm({ ...form, coverImage: '', coverImageAlt: '' })}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', border: `1.5px solid ${STATUS_COLORS.danger.border}`, borderRadius: '0.4rem', background: 'white', cursor: 'pointer', color: STATUS_COLORS.danger.color, fontSize: '0.8rem', fontWeight: '600' }}>
                        <X size={14} /> Remove
                      </button>
                    </div>
                    <input value={form.coverImageAlt} onChange={e => setForm({ ...form, coverImageAlt: e.target.value })}
                      placeholder="Alt text — describe the image for screen readers"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    width: '100%', padding: '1.75rem', border: `1.5px dashed ${C.border}`, borderRadius: '0.5rem',
                    background: C.card || '#F8FAFF', cursor: uploadingCover ? 'not-allowed' : 'pointer', color: C.gray500,
                  }}>
                  <ImageIcon size={22} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{uploadingCover ? 'Uploading…' : 'Click to upload a cover image'}</span>
                  <span style={{ fontSize: '0.75rem' }}>JPG, PNG or WebP, up to 5MB</span>
                </button>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
                Content * (use **bold text** for headings)
              </label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                rows={12} placeholder={`Write your blog post here...\n\n**Introduction**\nStart with an introduction paragraph.\n\n**Section Title**\nSection content here.\n\n**Conclusion**\nWrap up the article.`}
                style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.6' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
              <p style={{ color: C.gray500, fontSize: '0.75rem', marginTop: '0.3rem' }}>
                Use **text** for bold headings. Separate paragraphs with blank lines.
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.6rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem' }}>
                {form.tags.map(tag => (
                  <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem 0.25rem 0.65rem', background: C.accentLight, color: C.accent, borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: C.accent, padding: 0 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagInput);
                      setTagInput('');
                    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
                      removeTag(form.tags[form.tags.length - 1]);
                    }
                  }}
                  onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
                  placeholder={form.tags.length ? 'Add another…' : 'Type a tag and press Enter'}
                  style={{ flex: 1, minWidth: 140, border: 'none', outline: 'none', fontSize: '0.9rem', padding: '0.25rem' }}
                />
              </div>
              <p style={{ color: C.gray500, fontSize: '0.72rem', marginTop: '0.3rem' }}>Press Enter or comma to add a tag.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSubmit} disabled={saving || loadingEdit}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: (saving || loadingEdit) ? C.accentLight : C.accent, color: 'white', border: 'none', borderRadius: '0.5rem', cursor: (saving || loadingEdit) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                {loadingEdit ? 'Loading post...' : saving ? 'Saving...' : editBlog ? 'Update Post' : 'Publish Post'}
              </button>
              <button onClick={() => { setShowForm(false); setEditBlog(null); }}
                style={{ padding: '0.75rem 1.5rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', background: C.surface, color: C.primary }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : blogs.length === 0 ? (
        <div style={{ backgroundColor: C.surface, borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: `1px solid ${C.border}` }}>
          <p style={{ color: C.gray500, marginBottom: '1rem' }}>No blog posts yet.</p>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: C.accent, color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
            Create First Post
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {blogs.map(blog => (
            <div key={blog._id} style={{ backgroundColor: C.surface, borderRadius: '0.875rem', padding: '1.25rem 1.5rem', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem' }}>{blog.title}</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: blog.isPublished ? STATUS_COLORS.success.bg : STATUS_COLORS.neutral.bg, color: blog.isPublished ? STATUS_COLORS.success.color : STATUS_COLORS.neutral.color }}>
                    {blog.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {blog.category && (
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: C.accentLight, color: C.accent }}>
                      {blog.category}
                    </span>
                  )}
                  {blog.featured && (
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#fffbeb', color: '#b45309' }}>
                      ★ Featured
                    </span>
                  )}
                </div>
                <p style={{ color: C.gray500, fontSize: '0.8rem', marginBottom: '0.3rem' }}>{blog.excerpt?.substring(0, 100)}...</p>
                <p style={{ color: C.gray500, fontSize: '0.75rem' }}>
                  /{blog.slug} · {new Date(blog.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', border: `1px solid ${C.border}`, borderRadius: '0.4rem', textDecoration: 'none', color: C.gray500, fontSize: '0.8rem', fontWeight: '500' }}>
                  <Eye size={14} /> View
                </a>
                <button onClick={() => handleEdit(blog)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', border: `1px solid ${C.accent}`, borderRadius: '0.4rem', background: C.surface, cursor: 'pointer', color: C.accent, fontSize: '0.8rem', fontWeight: '600' }}>
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(blog._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', border: `1px solid ${STATUS_COLORS.danger.border}`, borderRadius: '0.4rem', background: C.surface, cursor: 'pointer', color: STATUS_COLORS.danger.color, fontSize: '0.8rem', fontWeight: '600' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}