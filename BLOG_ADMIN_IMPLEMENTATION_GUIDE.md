# Blog Admin Management System - Implementation Guide

## Overview
Complete blog management system for Oplus admins with full CRUD operations, rich text editing, and image uploads.

## Step 1: Database Setup

### Run SQL File
```bash
# In Supabase SQL Editor, run:
SETUP_BLOG_SYSTEM.sql
```

This creates:
- ✅ `blog_posts` table with all necessary fields
- ✅ `blog_categories` table with default categories
- ✅ RLS policies for security
- ✅ Triggers for auto-updating timestamps
- ✅ Indexes for performance

## Step 2: Install Required Packages

```bash
npm install react-quill @types/react-quill
```

React Quill is a rich text editor for blog content.

## Step 3: Add Blog Tab to Admin Panel

In `src/pages/Admin.tsx`, add a new tab:

```typescript
// Add to imports
import { FileText } from "lucide-react";

// Update TabsList grid-cols from 5 to 6
<TabsList className="grid w-full grid-cols-6">
  {/* Existing tabs... */}
  <TabsTrigger value="blog">
    <FileText className="w-4 h-4 mr-2" />
    <span className="hidden md:inline">Blog</span>
  </TabsTrigger>
</TabsList>

// Add Blog TabsContent
<TabsContent value="blog">
  {/* Blog management UI */}
</TabsContent>
```

## Step 4: Blog Management Features

### Features to Implement:

1. **List All Blog Posts**
   - Table view with title, category, status, views, date
   - Search and filter by category/status
   - Sort by date, views, likes

2. **Create New Post**
   - Title input
   - Slug (auto-generated from title)
   - Rich text editor for content
   - Excerpt textarea
   - Category dropdown
   - Cover image upload
   - Publish/Draft toggle
   - Featured toggle

3. **Edit Existing Post**
   - Load post data into form
   - Update all fields
   - Preview before publishing

4. **Delete Post**
   - Confirmation dialog
   - Soft delete option

5. **Publish/Unpublish**
   - Toggle published status
   - Auto-set published_at timestamp

## Step 5: Blog Post Schema

```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML from rich text editor
  category: string;
  author_name: string;
  author_id: string;
  cover_image?: string;
  read_time: string;
  published: boolean;
  featured: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}
```

## Step 6: Update Blog.tsx to Use Database

Replace hardcoded `blogPosts` with:

```typescript
const { data: blogPosts, isLoading } = useQuery({
  queryKey: ['blogPosts'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
});
```

## Step 7: Rich Text Editor Component

Create `src/components/RichTextEditor.tsx`:

```typescript
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      className="bg-white text-black"
    />
  );
};
```

## Step 8: Slug Generation

```typescript
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
```

## Step 9: Image Upload for Cover

Use existing thumbnail upload logic from Admin panel:

```typescript
const handleCoverImageUpload = async (file: File) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `blog-covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('thumbnails')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

## Step 10: Admin Blog Management UI Structure

```typescript
<TabsContent value="blog">
  <Card>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <Button onClick={() => setIsCreatingPost(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Blog Posts Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogPosts?.map(post => (
            <TableRow key={post.id}>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell>
                <Badge variant={post.published ? "success" : "secondary"}>
                  {post.published ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>{post.views_count}</TableCell>
              <TableCell>
                {new Date(post.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(post)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </Card>

  {/* Create/Edit Dialog */}
  <Dialog open={isCreatingPost} onOpenChange={setIsCreatingPost}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingPost ? 'Edit Post' : 'Create New Post'}
        </DialogTitle>
      </DialogHeader>
      
      {/* Form fields here */}
      
    </DialogContent>
  </Dialog>
</TabsContent>
```

## Step 11: Testing Checklist

- [ ] Run SETUP_BLOG_SYSTEM.sql
- [ ] Install react-quill package
- [ ] Add Blog tab to Admin panel
- [ ] Test creating a new post
- [ ] Test editing existing post
- [ ] Test publishing/unpublishing
- [ ] Test deleting post
- [ ] Test image upload
- [ ] Verify Blog.tsx shows database posts
- [ ] Test category filtering
- [ ] Test search functionality

## Security Notes

- ✅ RLS policies ensure only admins can manage posts
- ✅ Published posts are publicly viewable
- ✅ Draft posts are hidden from public
- ✅ Admin email check: `admin@oplus.ai`

## Future Enhancements

- [ ] SEO meta tags per post
- [ ] Tags system
- [ ] Comments on blog posts
- [ ] Related posts
- [ ] Social sharing
- [ ] Analytics dashboard
- [ ] Scheduled publishing
- [ ] Multiple authors
- [ ] Revision history

## Quick Start

1. Run `SETUP_BLOG_SYSTEM.sql` in Supabase
2. Install `npm install react-quill @types/react-quill`
3. Add Blog tab to Admin panel
4. Start creating posts!

The system is now ready for full blog management! 🎉
