import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Upload, Save, Eye, ArrowLeft, CheckCircle2, Bold, Italic, List, Link, Code, Heading1, Heading2, Quote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Demo categories and tags
const CATEGORIES = ['Consciousness', 'Technology', 'Philosophy', 'Science', 'Digital Organism', 'Emergence'];
const SUGGESTED_TAGS = ['consciousness', 'fractal', 'emergence', 'AI', 'digital', 'organism', 'complexity', 'neural', 'network', 'evolution'];

const BlogEditorPage = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    featured_image: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && slug) {
      // Load existing post data
      const loadPost = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/blog/posts/${slug}`);
          if (response.data) {
            setForm({
              title: response.data.title || '',
              excerpt: response.data.excerpt || '',
              content: response.data.content || '',
              category: response.data.category || '',
              tags: response.data.tags?.join(', ') || '',
              featured_image: response.data.featured_image || ''
            });
          }
        } catch {
          // If API fails, use demo data
          setForm({
            title: 'Sample Blog Post',
            excerpt: 'This is a sample blog post for editing.',
            content: `# Sample Blog Post

This is a **sample blog post** that demonstrates the *Markdown editor*.

## Features

- Rich text editing
- Live preview
- Markdown support
- Code highlighting

\`\`\`javascript
// Example code block
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> This is a blockquote example.

[Learn more about Markdown](https://markdown.com)`,
            category: 'Technology',
            tags: 'markdown, editor, demo',
            featured_image: ''
          });
        }
      };
      loadPost();
    }
  }, [mode, slug]);

  const handleSave = async (publish = false) => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: publish ? 'published' : 'draft'
      };
      if (mode === 'edit') {
        await axios.post(`${API_BASE_URL}/blog/posts`, { ...data, slug }); // Should be PUT/PATCH in real API
      } else {
        await axios.post(`${API_BASE_URL}/blog/posts`, data);
      }
      setSuccess(true);
      setTimeout(() => navigate('/blog'), 1200);
    } catch {
      setError('Failed to save post.');
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (type) => {
    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    let insertion = '';

    switch (type) {
      case 'bold':
        insertion = `**${text.substring(start, end) || 'bold text'}**`;
        break;
      case 'italic':
        insertion = `*${text.substring(start, end) || 'italic text'}*`;
        break;
      case 'h1':
        insertion = `# ${text.substring(start, end) || 'Heading 1'}`;
        break;
      case 'h2':
        insertion = `## ${text.substring(start, end) || 'Heading 2'}`;
        break;
      case 'list':
        insertion = `- ${text.substring(start, end) || 'List item'}`;
        break;
      case 'link':
        insertion = `[${text.substring(start, end) || 'link text'}](url)`;
        break;
      case 'code':
        insertion = `\`${text.substring(start, end) || 'code'}\``;
        break;
      case 'quote':
        insertion = `> ${text.substring(start, end) || 'Quote text'}`;
        break;
      default:
        return;
    }

    const newText = text.substring(0, start) + insertion + text.substring(end);
    setForm(prev => ({ ...prev, content: newText }));
    
    // Focus back on textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertion.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                {mode === 'create' ? 'Create New Post' : 'Edit Post'}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'create' ? 'Write your next great article' : 'Update your post'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="md:hidden"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Post saved successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle>Title</CardTitle>
                <CardDescription>Enter a compelling title for your post</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter your post title..."
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold"
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Write your post content using Markdown</CardDescription>
                
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('h1')}
                    className="h-8 px-2"
                  >
                    <Heading1 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('h2')}
                    className="h-8 px-2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('bold')}
                    className="h-8 px-2"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('italic')}
                    className="h-8 px-2"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('list')}
                    className="h-8 px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('link')}
                    className="h-8 px-2"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('code')}
                    className="h-8 px-2"
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('quote')}
                    className="h-8 px-2"
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`grid ${showPreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {/* Editor */}
                  <div className={`${showPreview ? 'md:block' : 'block'} ${showPreview ? 'hidden md:block' : ''}`}>
                    <textarea
                      id="content-editor"
                      value={form.content}
                      onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your post content here using Markdown..."
                      className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>
                  
                  {/* Preview */}
                  <div className={`${showPreview ? 'block' : 'hidden'} ${showPreview ? 'md:block' : 'md:hidden'}`}>
                    <div className="h-96 p-4 border rounded-lg overflow-y-auto prose prose-sm max-w-none">
                      {form.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {form.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-muted-foreground">Preview will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle>Excerpt</CardTitle>
                <CardDescription>Brief summary of your post</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Enter a brief excerpt..."
                  className="w-full h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
                <CardDescription>Select a category for your post</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Add relevant tags (comma-separated)</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="consciousness, fractal, emergence..."
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {SUGGESTED_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        const currentTags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
                        if (!currentTags.includes(tag)) {
                          const newTags = [...currentTags, tag].join(', ');
                          setForm(prev => ({ ...prev, tags: newTags }));
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>Add a featured image URL</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={form.featured_image}
                  onChange={(e) => setForm(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                {form.featured_image && (
                  <div className="mt-2">
                    <img
                      src={form.featured_image}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditorPage; 