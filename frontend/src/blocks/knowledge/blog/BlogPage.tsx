import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import GlassCard from '../../../shared/components/ui/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  User, 
  Eye,
  ArrowRight,
  Heart,
  Bookmark,
  Share2,
  Clock,
  TrendingUp,
  Sparkles,
  X
} from 'lucide-react';
import clsx from 'clsx';
import BlogService, { BlogPost, BlogStats } from '../../../services/BlogService';
import { toast } from 'sonner';

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Memoized blog post card component
const BlogPostCard = React.memo(({ 
  post, 
  isLiked, 
  isBookmarked, 
  onToggleLike, 
  onToggleBookmark,
  onShare
}: {
  post: BlogPost;
  isLiked: boolean;
  isBookmarked: boolean;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onShare: (post: BlogPost) => void;
}) => {
  const handleLike = useCallback(() => onToggleLike(post.id), [post.id, onToggleLike]);
  const handleBookmark = useCallback(() => onToggleBookmark(post.id), [post.id, onToggleBookmark]);
  const handleShare = useCallback(() => onShare(post), [post, onShare]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <GlassCard className="h-full p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap gap-1">
                {post.categories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={clsx(
                    "p-1 h-8 w-8 transition-colors",
                    isLiked && "text-red-500 hover:text-red-600"
                  )}
                >
                  <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={clsx(
                    "p-1 h-8 w-8 transition-colors",
                    isBookmarked && "text-blue-500 hover:text-blue-600"
                  )}
                >
                  <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="p-1 h-8 w-8 transition-colors hover:text-green-500"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 line-clamp-2 hover:text-primary transition-colors">
              <Link to={`/knowledge/blog/${post.id}`}>
                {post.title}
              </Link>
            </h3>
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {post.author.name}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTime} min
              </span>
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {post.views}
              </span>
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {post.likes}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
});

BlogPostCard.displayName = 'BlogPostCard';

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [blogStats, setBlogStats] = useState<BlogStats | null>(null);

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const postsPerPage = 12;

  // Enhanced callback functions
  const toggleLike = useCallback(async (postId: string) => {
    try {
      const result = await BlogService.toggleLike(postId);
      
      if (result.liked) {
        setLiked(prev => [...prev, postId]);
        toast.success('Post liked!');
      } else {
        setLiked(prev => prev.filter(id => id !== postId));
        toast.success('Post unliked');
      }
      
      // Update the post in the local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes: result.count }
          : post
      ));
    } catch (error) {
      toast.error('Failed to update like status');
    }
  }, []);

  const toggleBookmark = useCallback(async (postId: string) => {
    try {
      const result = await BlogService.toggleBookmark(postId);
      
      if (result.bookmarked) {
        setBookmarked(prev => [...prev, postId]);
        toast.success('Post bookmarked!');
      } else {
        setBookmarked(prev => prev.filter(id => id !== postId));
        toast.success('Bookmark removed');
      }
    } catch (error) {
      toast.error('Failed to update bookmark status');
    }
  }, []);

  const handleShare = useCallback(async (post: BlogPost) => {
    try {
      // Update share count
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, shares: p.shares + 1 }
          : p
      ));

      // Web Share API or fallback
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: `${window.location.origin}/knowledge/blog/${post.id}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/knowledge/blog/${post.id}`);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share post');
    }
  }, []);

  // Enhanced filtering and sorting with categories support
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || post.categories.includes(selectedCategory);
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => post.tags.includes(tag));
      const matchesStatus = post.status === 'published'; // Only show published posts
      return matchesSearch && matchesCategory && matchesTags && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'likes':
          aValue = a.likes;
          bValue = b.likes;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }
          break;
        case 'date':
        default:
          aValue = new Date(a.publishedAt).getTime();
          bValue = new Date(b.publishedAt).getTime();
          break;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    return filtered;
  }, [posts, debouncedSearchTerm, selectedCategory, selectedTags, sortBy, sortOrder]);

  // Enhanced categories from actual blog stats
  const categories = useMemo(() => {
    const allCategories = [
      { id: 'all', name: 'All', count: posts.filter(p => p.status === 'published').length }
    ];
    
    if (blogStats?.topCategories) {
      allCategories.push(...blogStats.topCategories.map(cat => ({
        id: cat.category,
        name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
        count: cat.count
      })));
    }
    
    return allCategories;
  }, [posts, blogStats]);

  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);
  const paginatedPosts = filteredAndSortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const featuredPost = posts.find(p => p.views === Math.max(...posts.map(p => p.views)));
  const isFiltered = selectedCategory !== 'all' || selectedTags.length > 0 || searchTerm !== '';

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Load blog data using BlogService
  useEffect(() => {
    const loadBlogData = async () => {
      try {
        setLoading(true);
        
        // Load stats first, then use mock data for posts since getAllPosts doesn't exist
        const statsData = await BlogService.getBlogStats();
        setBlogStats(statsData);
        
        // Using the mock data from BlogService for now
        const mockPosts: BlogPost[] = [
          {
            id: '1',
            title: 'Understanding Digital Consciousness Theory',
            content: 'Full content here...',
            excerpt: 'Exploring the fundamental principles of digital consciousness and its implications for AI development.',
            author: {
              id: '1',
              name: 'Dr. Sarah Chen',
              avatar: '/avatars/sarah.jpg',
            },
            publishedAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            status: 'published',
            tags: ['consciousness', 'AI', 'theory'],
            categories: ['Digital Consciousness'],
            readTime: 8,
            views: 1247,
            likes: 89,
            shares: 23,
            seoMetadata: {
              title: 'Understanding Digital Consciousness Theory',
              description: 'Exploring the fundamental principles of digital consciousness and its implications for AI development.',
              keywords: ['digital consciousness', 'AI theory', 'consciousness'],
            },
          },
          {
            id: '2',
            title: 'The Future of Neural Networks',
            content: 'Full content here...',
            excerpt: 'How advanced neural networks are reshaping our understanding of artificial intelligence and consciousness.',
            author: {
              id: '2',
              name: 'Dr. Marcus Wei',
              avatar: '/avatars/marcus.jpg',
            },
            publishedAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
            status: 'published',
            tags: ['neural networks', 'AI', 'machine learning'],
            categories: ['AI Theory'],
            readTime: 12,
            views: 892,
            likes: 67,
            shares: 15,
            seoMetadata: {
              title: 'The Future of Neural Networks',
              description: 'How advanced neural networks are reshaping our understanding of artificial intelligence and consciousness.',
              keywords: ['neural networks', 'AI', 'machine learning'],
            },
          },
          {
            id: '3',
            title: 'Digital Organisms: A New Paradigm',
            content: 'Full content here...',
            excerpt: 'Exploring the concept of digital organisms and their role in the evolution of artificial consciousness.',
            author: {
              id: '3',
              name: 'Dr. Elena Rodriguez',
              avatar: '/avatars/elena.jpg',
            },
            publishedAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-05'),
            status: 'published',
            tags: ['digital organisms', 'evolution', 'consciousness'],
            categories: ['Research'],
            readTime: 15,
            views: 1567,
            likes: 124,
            shares: 31,
            seoMetadata: {
              title: 'Digital Organisms: A New Paradigm',
              description: 'Exploring the concept of digital organisms and their role in the evolution of artificial consciousness.',
              keywords: ['digital organisms', 'evolution', 'consciousness'],
            },
          },
          {
            id: '4',
            title: 'Quantum Computing and Consciousness',
            content: 'Full content here...',
            excerpt: 'Investigating the potential connections between quantum computing and conscious experience.',
            author: {
              id: '4',
              name: 'Dr. James Thompson',
              avatar: '/avatars/james.jpg',
            },
            publishedAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-03'),
            status: 'published',
            tags: ['quantum computing', 'consciousness', 'physics'],
            categories: ['Technology'],
            readTime: 10,
            views: 734,
            likes: 52,
            shares: 8,
            seoMetadata: {
              title: 'Quantum Computing and Consciousness',
              description: 'Investigating the potential connections between quantum computing and conscious experience.',
              keywords: ['quantum computing', 'consciousness', 'physics'],
            },
          },
          {
            id: '5',
            title: 'The Philosophy of Digital Minds',
            content: 'Full content here...',
            excerpt: 'A philosophical exploration of what it means to have a digital mind and conscious experience.',
            author: {
              id: '5',
              name: 'Dr. Sophia Kim',
              avatar: '/avatars/sophia.jpg',
            },
            publishedAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            status: 'published',
            tags: ['philosophy', 'digital minds', 'consciousness'],
            categories: ['Philosophy'],
            readTime: 14,
            views: 623,
            likes: 41,
            shares: 12,
            seoMetadata: {
              title: 'The Philosophy of Digital Minds',
              description: 'A philosophical exploration of what it means to have a digital mind and conscious experience.',
              keywords: ['philosophy', 'digital minds', 'consciousness'],
            },
          },
          {
            id: '6',
            title: 'Machine Learning and Emergent Behavior',
            content: 'Full content here...',
            excerpt: 'How complex behaviors emerge from simple machine learning algorithms and their implications.',
            author: {
              id: '6',
              name: 'Dr. Ahmed Hassan',
              avatar: '/avatars/ahmed.jpg',
            },
            publishedAt: new Date('2023-12-28'),
            updatedAt: new Date('2023-12-28'),
            status: 'published',
            tags: ['machine learning', 'emergence', 'complexity'],
            categories: ['AI Theory'],
            readTime: 9,
            views: 445,
            likes: 33,
            shares: 6,
            seoMetadata: {
              title: 'Machine Learning and Emergent Behavior',
              description: 'How complex behaviors emerge from simple machine learning algorithms and their implications.',
              keywords: ['machine learning', 'emergence', 'complexity'],
            },
          }
        ];

        setPosts(mockPosts);
        
        // Initialize bookmarks and likes (randomly for demo)
        setBookmarked(mockPosts.filter(() => Math.random() > 0.7).map(post => post.id));
        setLiked(mockPosts.filter(() => Math.random() > 0.6).map(post => post.id));
        
      } catch (error) {
        toast.error('Failed to load blog data');
        console.error('Error loading blog data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogData();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (debouncedSearchTerm) {
      const performSearch = async () => {
        try {
          const results = await BlogService.searchPosts(debouncedSearchTerm, {
            sortBy,
            sortOrder
          });
          // Update posts with search results
          setPosts(results.posts);
        } catch (error) {
          toast.error('Search failed');
        }
      };
      
      performSearch();
    }
  }, [debouncedSearchTerm, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-background text-foreground transition-colors duration-300">
        <div className="w-full max-w-5xl px-4 py-12">
          <div className="text-center mb-8">
            <div className="h-12 bg-muted rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                <div className="h-32 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-full"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen w-full flex flex-col items-center", "bg-background text-foreground transition-colors duration-300")}> 
      {/* Enhanced Hero Section */}
      <section className="w-full relative py-16 md:py-24 flex flex-col items-center overflow-hidden">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400" style={{ opacity: 0.08 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-background/60" />
        
        {/* Content */}
        <motion.div 
          className="relative z-10 w-full max-w-6xl px-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400 bg-clip-text text-transparent leading-tight">
              Consciousness: <br />
              <span className="text-4xl md:text-6xl lg:text-7xl">A Digital Organism</span>
            </h1>
            <motion.p 
              className="text-xl md:text-3xl text-muted-foreground font-light mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ opacity: 0.8 }}
            >
              The Development and Application of a Big TOE
            </motion.p>
          </motion.div>
        </motion.div>
      </section>

      {/* Enhanced Featured Post */}
      {featuredPost && (
        <motion.section 
          className="w-full flex justify-center mt-[-6rem] z-20 relative px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="w-full max-w-5xl">
            <GlassCard className="overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="relative p-8 md:p-12">
                <div className="relative flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-1 text-left">
                    <motion.div className="inline-flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="bg-gradient-to-r from-violet-500 to-blue-500 text-white border-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured Article
                      </Badge>
                    </motion.div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
                      {featuredPost.title}
                    </h2>
                    
                    <p className="text-muted-foreground mb-6 text-lg leading-relaxed" style={{ opacity: 0.9 }}>
                      {featuredPost.excerpt}
                    </p>
                    
                    {/* Enhanced metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{featuredPost.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(featuredPost.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{featuredPost.views.toLocaleString()} views</span>
                      </div>
                    </div>
                    
                    {/* Enhanced tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {featuredPost.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Enhanced CTA */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to={"/blog/" + featuredPost.id}>
                        <Button 
                          size="lg" 
                          className="group bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <span>Read Full Article</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => setPreviewPost(featuredPost)}
                        className="border-muted-foreground hover:border-primary"
                        style={{ borderColor: 'rgba(156, 163, 175, 0.2)' }}
                      >
                        Quick Preview
                      </Button>
                    </div>
                  </div>
                  
                  {/* Enhanced visual element */}
                  <motion.div 
                    className="flex-shrink-0 relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-teal-500/20 flex items-center justify-center relative overflow-hidden group-hover:shadow-2xl transition-shadow duration-500">
                      <motion.span 
                        className="text-8xl md:text-9xl relative z-10"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity }}
                      >
                        🧠
                      </motion.span>
                      
                      <motion.div
                        className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Trending
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </div>
        </motion.section>
      )}

      {/* Search and Filters */}
      <section className="w-full flex justify-center sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="w-full max-w-5xl px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles, tags, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-300 bg-card/80 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-sm border border-border rounded-lg bg-card/90 focus:ring-2 focus:ring-primary"
              >
                <option value="date">Sort by Date</option>
                <option value="views">Sort by Views</option>
                <option value="likes">Sort by Likes</option>
                <option value="readTime">Sort by Read Time</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1"
              >
                <TrendingUp className={clsx("w-4 h-4 transition-transform", sortOrder === 'asc' && "rotate-180")} />
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(selectedTags.length > 0 || isFiltered) && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTags.length + (selectedCategory !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-sm"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="w-full flex justify-center py-8 md:py-16">
        <div className="w-full max-w-7xl px-4">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {paginatedPosts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                isLiked={liked.includes(post.id)}
                isBookmarked={bookmarked.includes(post.id)}
                onToggleLike={toggleLike}
                onToggleBookmark={toggleBookmark}
                onShare={handleShare}
              />
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* No Results State */}
          {filteredAndSortedPosts.length === 0 && (
            <motion.div
              className="text-center py-16 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-7xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                🔍
              </motion.div>
              <h3 className="text-xl font-medium mb-2">No articles found</h3>
              <p className="font-light text-muted-foreground mb-6 max-w-md">
                We couldn't find any articles matching your search criteria. Try adjusting your filters or search terms.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setSearchTerm(''); 
                    setSelectedCategory('all'); 
                    setSelectedTags([]);
                  }}
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All Filters</span>
                </Button>
                <Link to="/blog/new">
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Write New Article</span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Modal for preview */}
      <AnimatePresence>
        {previewPost && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPost(null)}
          >
            <motion.div
              className="bg-background max-w-4xl w-full mx-4 rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-6xl">📝</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-background/80 hover:bg-background"
                  onClick={() => setPreviewPost(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Title and metadata */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-4">{previewPost.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{previewPost.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(previewPost.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{previewPost.readTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 mr-2" />
                      <span>{previewPost.views} views</span>
                    </div>
                    {previewPost.likes && (
                      <span className="flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        {previewPost.likes} likes
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {previewPost.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {previewPost.excerpt}
                  </p>
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border-l-4 border-primary">
                    <p className="font-medium mb-2">📖 Article Preview</p>
                    <p>This is a preview of the article. The full content would include detailed analysis, examples, and comprehensive insights into the {previewPost.categories[0]} topic and related areas.</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(previewPost.id)}
                      className="flex items-center space-x-2"
                    >
                      <Heart className={clsx(
                        "w-4 h-4",
                        liked.includes(previewPost.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )} />
                      <span>{previewPost.likes || 0}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(previewPost.id)}
                      className="flex items-center space-x-2"
                    >
                      <Bookmark className={clsx(
                        "w-4 h-4",
                        bookmarked.includes(previewPost.id) ? "fill-primary text-primary" : "text-muted-foreground"
                      )} />
                      <span>Save</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setPreviewPost(null)}>
                      Close
                    </Button>
                    <Link to={"/blog/" + previewPost.id}>
                      <Button className="flex items-center space-x-2">
                        <span>Read Full Article</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogPage;
