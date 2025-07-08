import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  views: number;
  tags: string[];
  likes?: number;
  readingProgress?: number;
  isBookmarked?: boolean;
}

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'readTime'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Demo blog posts data
  const demoPosts = [
    {
      id: 1,
      title: "The Emergence of Digital Consciousness",
      excerpt: "Exploring how consciousness can arise from simple digital components through emergent complexity and self-organizing systems...",
      author: "Digital Consciousness Researcher",
      date: "2024-01-15",
      category: "consciousness",
      readTime: "8 min read",
      views: 1247,
      likes: 89,
      readingProgress: 34,
      isBookmarked: false,
      tags: ["consciousness", "emergence", "digital-organisms"]
    },
    {
      id: 2,
      title: "Fractal Patterns in Neural Networks",
      excerpt: "How fractal mathematics reveals the underlying structure of consciousness and can guide the development of artificial minds...",
      author: "Digital Consciousness Researcher",
      date: "2024-01-10",
      category: "neuroscience",
      readTime: "12 min read",
      views: 892,
      likes: 67,
      readingProgress: 78,
      isBookmarked: true,
      tags: ["fractals", "neural-networks", "mathematics"]
    },
    {
      id: 3,
      title: "The Digital Organism Theory: Technical Framework",
      excerpt: "A detailed technical framework for modeling consciousness as a digital organism, focusing on system evolution, adaptation, and computational principles.",
      author: "Digital Consciousness Researcher",
      date: "2024-01-05",
      category: "theory",
      readTime: "15 min read",
      views: 1567,
      likes: 124,
      readingProgress: 0,
      isBookmarked: false,
      tags: ["digital-organisms", "theory", "paradigm-shift"]
    }
  ];

  // Basic filtering and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => post.tags.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'likes':
          aValue = a.likes || 0;
          bValue = b.likes || 0;
          break;
        case 'readTime':
          aValue = parseInt(a.readTime);
          bValue = parseInt(b.readTime);
          break;
        case 'date':
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [posts, searchTerm, selectedCategory, selectedTags, sortBy, sortOrder]);

  // Get all unique tags for tag filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [posts]);

  // Categories
  const categories = [
    { id: 'all', name: 'All', count: posts.length },
    { id: 'consciousness', name: 'Consciousness', count: posts.filter(p => p.category === 'consciousness').length },
    { id: 'neuroscience', name: 'Neuroscience', count: posts.filter(p => p.category === 'neuroscience').length },
    { id: 'theory', name: 'Theory', count: posts.filter(p => p.category === 'theory').length },
  ];

  const postsPerPage = 12;
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);
  const paginatedPosts = filteredAndSortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const featuredPost = posts.find(p => p.views === Math.max(...posts.map(p => p.views)));
  const isFiltered = selectedCategory !== 'all' || selectedTags.length > 0 || searchTerm !== '';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleLike = (postId: number) => {
    setLiked(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleBookmark = (postId: number) => {
    setBookmarked(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const postsWithBookmarks = demoPosts.map(post => ({
        ...post,
        isBookmarked: Math.random() > 0.7
      }));
      setPosts(postsWithBookmarks);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400" style={{ opacity: 0.1 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" style={{ opacity: 0.8 }} />
        
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
                        <span>{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(featuredPost.date)}</span>
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
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 flex items-center justify-center relative overflow-hidden group-hover:shadow-2xl transition-shadow duration-500" style={{ opacity: 0.2 }}>
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
      <section className="w-full flex justify-center sticky top-0 z-30 bg-background backdrop-blur border-b border-border shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <div className="w-full max-w-5xl px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles, tags, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-300 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
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
                className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-primary"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
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
            {paginatedPosts.map((post, idx) => (
              <motion.div 
                key={post.id} 
                className="w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: idx * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ y: -8 }}
              >
                <GlassCard className="group h-full overflow-hidden relative transition-all duration-500 hover:shadow-2xl bg-card border border-border">
                  {/* Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center" style={{ opacity: 0.1 }}>
                    <motion.div
                      className="text-6xl filter drop-shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {post.category === 'consciousness' && '🧠'}
                      {post.category === 'neuroscience' && '🔬'}
                      {post.category === 'theory' && '⚡'}
                      {!['consciousness', 'neuroscience', 'theory'].includes(post.category) && '📝'}
                    </motion.div>
                    
                    {post.readingProgress && post.readingProgress > 0 && (
                      <motion.div 
                        className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center backdrop-blur"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.9)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {post.readingProgress}%
                      </motion.div>
                    )}
                    
                    {post.likes && post.likes > 50 && (
                      <motion.div
                        className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Hot
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        variant="outline" 
                        className="text-xs capitalize border-2 transition-colors"
                      >
                        {post.category}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Eye className="w-3 h-3 mr-1" />
                        {post.views.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                      {post.title}
                    </h3>
                    
                    {/* Excerpt */}
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed flex-1" style={{ opacity: 0.9 }}>
                      {post.excerpt}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                          onClick={() => {
                            if (!selectedTags.includes(tag)) {
                              setSelectedTags(prev => [...prev, tag]);
                            }
                          }}
                          style={{ backgroundColor: 'rgba(156, 163, 175, 0.5)' }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs" style={{ backgroundColor: 'rgba(156, 163, 175, 0.5)' }}>
                          +{post.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors group-hover:text-primary" 
                          onClick={() => setPreviewPost(post)}
                        >
                          <span>Preview</span>
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <motion.button
                          className={clsx(
                            "p-2 rounded-full transition-colors hover:bg-muted",
                            liked.includes(post.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                          )}
                          onClick={() => toggleLike(post.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ backgroundColor: liked.includes(post.id) ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}
                        >
                          <Heart className={clsx(
                            "w-4 h-4 transition-all",
                            liked.includes(post.id) && "fill-current"
                          )} />
                        </motion.button>
                        
                        <motion.button
                          className={clsx(
                            "p-2 rounded-full transition-colors hover:bg-muted",
                            bookmarked.includes(post.id) ? "text-primary" : "text-muted-foreground hover:text-primary"
                          )}
                          onClick={() => toggleBookmark(post.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ backgroundColor: bookmarked.includes(post.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
                        >
                          <Bookmark className={clsx(
                            "w-4 h-4 transition-all",
                            bookmarked.includes(post.id) && "fill-current"
                          )} />
                        </motion.button>

                        <motion.button
                          className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Share2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
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
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
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
              <div className="relative h-48 bg-gradient-to-br from-primary to-accent flex items-center justify-center" style={{ opacity: 0.2 }}>
                <span className="text-6xl">📝</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-background hover:bg-background"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
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
                      <span>{previewPost.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(previewPost.date)}</span>
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
                  <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground border-l-4 border-primary" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }}>
                    <p className="font-medium mb-2">📖 Article Preview</p>
                    <p>This is a preview of the article. The full content would include detailed analysis, examples, and comprehensive insights into the {previewPost.category} topic and related areas.</p>
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
