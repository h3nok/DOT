import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  FileText,
  Tag,
  Calendar
} from 'lucide-react';
import EnhancedMarkdown from '../../../shared/components/ui/EnhancedMarkdown';
import ReadingContainer from '../../../shared/components/ui/reading-container';
import { TagInput } from '../../../forms/components';
import { useBlogEditor } from '../../../forms/hooks/useBlogEditor';

const BlogEditorPage = () => {
  const { id } = useParams();
  const { form, saving, showPreview, setShowPreview, onSubmit, categories, isEditing } = useBlogEditor({
    postId: id,
    isEditing: id !== 'new'
  });

  const { register, watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/blog" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-orbitron font-bold">
                  {isEditing ? 'Edit Post' : 'Create New Post'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                onClick={onSubmit}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor */}
          <div className={`${showPreview ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Content Editor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={onSubmit}>
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className={errors.title ? "text-destructive" : ""}>
                      Title {errors.title && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Enter post title..."
                      className={`mt-2 ${errors.title ? 'border-destructive' : ''}`}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Input
                      id="excerpt"
                      {...register('excerpt')}
                      placeholder="Brief description of the post..."
                      className="mt-2"
                    />
                    {errors.excerpt && (
                      <p className="text-sm text-destructive mt-1">{errors.excerpt.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category {errors.category && <span className="text-destructive">*</span>}</Label>
                    <select
                      id="category"
                      {...register('category')}
                      className={`mt-2 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground ${errors.category ? 'border-destructive' : ''}`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <Label>Tags</Label>
                    <div className="mt-2">
                      <TagInput
                        value={watchedValues.tags || []}
                        onChange={(tags) => setValue('tags', tags)}
                        placeholder="Add a tag..."
                        maxTags={10}
                      />
                      {errors.tags && (
                        <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <Label htmlFor="content">Content (Markdown) {errors.content && <span className="text-destructive">*</span>}</Label>
                    <textarea
                      id="content"
                      {...register('content')}
                      placeholder="Write your post content in Markdown..."
                      rows={20}
                      className={`mt-2 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono text-sm resize-none ${errors.content ? 'border-destructive' : ''}`}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReadingContainer>
                    <div className="prose prose-lg max-w-none animate-fade-in">
                      <h1>{watchedValues.title || 'Untitled Post'}</h1>
                      {watchedValues.excerpt && (
                        <p className="text-muted-foreground italic">{watchedValues.excerpt}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date().toLocaleDateString()}
                        </div>
                        {watchedValues.category && (
                          <Badge variant="outline">{watchedValues.category}</Badge>
                        )}
                      </div>
                      {watchedValues.tags && watchedValues.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {watchedValues.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                              <Tag className="w-3 h-3" />
                              <span>{tag}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <EnhancedMarkdown 
                        content={watchedValues.content || '*Start writing your content...*'}
                        allowMath={true}
                        allowCodeHighlight={true}
                        maxWidth="full"
                        fontSize="base"
                        lineHeight="relaxed"
                      />
                    </div>
                  </ReadingContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditorPage;