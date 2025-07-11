import { z } from 'zod';

// Simplified blog post schema
export const blogPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  
  excerpt: z
    .string()
    .max(500, 'Excerpt must be less than 500 characters')
    .default(''),
  
  category: z
    .enum(['consciousness', 'neuroscience', 'theory', 'philosophy', 'complexity', 'future'], {
      errorMap: () => ({ message: 'Please select a valid category' }),
    }),
  
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
  
  status: z
    .enum(['draft', 'published', 'archived'], {
      errorMap: () => ({ message: 'Please select a valid status' }),
    })
    .default('draft'),
  
  publishedAt: z
    .date()
    .optional(),
  
  featuredImage: z
    .string()
    .url('Must be a valid URL')
    .optional(),
  
  metaDescription: z
    .string()
    .max(160, 'Meta description must be less than 160 characters')
    .optional(),
  
  metaKeywords: z
    .array(z.string().min(1).max(30))
    .max(5, 'Maximum 5 keywords allowed')
    .default([]),
});

// Create and update schemas (different validation rules)
export const createBlogPostSchema = blogPostSchema.omit({ publishedAt: true });

export const updateBlogPostSchema = blogPostSchema.partial().extend({
  id: z.string().min(1, 'Post ID is required'),
});

// Draft schema (more lenient for auto-saves)
export const draftBlogPostSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  excerpt: z.string().max(500).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10).default([]),
  status: z.literal('draft'),
});

// Type exports
export type BlogPostFormData = z.infer<typeof blogPostSchema>;
export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>;
export type DraftBlogPostData = z.infer<typeof draftBlogPostSchema>;

// Validation helpers
export const validateBlogPost = (data: unknown) => {
  return blogPostSchema.safeParse(data);
};

export const validateDraftBlogPost = (data: unknown) => {
  return draftBlogPostSchema.safeParse(data);
};

// Form field validation functions
export const validateTitle = (title: string) => {
  const result = z.string().min(1).max(200).safeParse(title);
  return result.success ? null : result.error.errors[0]?.message;
};

export const validateContent = (content: string) => {
  const result = z.string().min(10).max(50000).safeParse(content);
  return result.success ? null : result.error.errors[0]?.message;
};

export const validateCategory = (category: string) => {
  const result = z.enum(['consciousness', 'neuroscience', 'theory', 'philosophy', 'complexity', 'future']).safeParse(category);
  return result.success ? null : result.error.errors[0]?.message;
};

export const validateTags = (tags: string[]) => {
  const result = z.array(z.string().min(1).max(50)).max(10).safeParse(tags);
  return result.success ? null : result.error.errors[0]?.message;
};
