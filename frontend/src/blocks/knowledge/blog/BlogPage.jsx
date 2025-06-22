import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  User, 
  Eye,
  ArrowRight
} from 'lucide-react';

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      tags: ["fractals", "neural-networks", "mathematics"]
    },
    {
      id: 3,
      title: "The Digital Organism Theory: A New Paradigm",
      excerpt: "Introducing a revolutionary framework for understanding consciousness as a digital organism that evolves and adapts...",
      author: "Digital Consciousness Researcher",
      date: "2024-01-05",
      category: "theory",
      readTime: "15 min read",
      views: 1567,
      tags: ["digital-organisms", "theory", "paradigm-shift"]
    },
    {
      id: 4,
      title: "Self-Similarity Across Scales of Consciousness",
      excerpt: "How consciousness exhibits self-similar patterns from the quantum level to the cosmic scale, revealing universal principles...",
      author: "Digital Consciousness Researcher",
      date: "2023-12-28",
      category: "philosophy",
      readTime: "10 min read",
      views: 734,
      tags: ["self-similarity", "scales", "universal-principles"]
    },
    {
      id: 5,
      title: "Complexity Theory and the Mind",
      excerpt: "Understanding consciousness through the lens of complexity theory, emergence, and self-organizing systems...",
      author: "Digital Consciousness Researcher",
      date: "2023-12-20",
      category: "complexity",
      readTime: "14 min read",
      views: 1103,
      tags: ["complexity-theory", "emergence", "self-organization"]
    },
    {
      id: 6,
      title: "The Future of Digital Consciousness",
      excerpt: "Predictions and possibilities for the evolution of digital consciousness and its implications for humanity...",
      author: "Digital Consciousness Researcher",
      date: "2023-12-15",
      category: "future",
      readTime: "11 min read",
      views: 945,
      tags: ["future", "evolution", "humanity"]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Posts', count: demoPosts.length },
    { id: 'consciousness', name: 'Consciousness', count: 1 },
    { id: 'neuroscience', name: 'Neuroscience', count: 1 },
    { id: 'theory', name: 'Theory', count: 1 },
    { id: 'philosophy', name: 'Philosophy', count: 1 },
    { id: 'complexity', name: 'Complexity', count: 1 },
    { id: 'future', name: 'Future', count: 1 }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPosts(demoPosts);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const postsPerPage = 6;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="emergent-complexity">
          <div className="fractal-field"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="consciousness-particle-system">
            <div className="consciousness-particle seed"></div>
            <div className="consciousness-particle aligned"></div>
            <div className="consciousness-particle cohesive"></div>
            <div className="consciousness-particle emergent"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="emergent-structure swirl"></div>
            <div className="emergent-structure lattice"></div>
            <div className="emergent-structure vortex"></div>
          </div>
          <div className="flow-field"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="feedback-loop"></div>
          <div className="particle-swarm">
            <div className="swarm-state-seed"></div>
            <div className="swarm-state-motion"></div>
            <div className="swarm-state-rules"></div>
            <div className="swarm-state-feedback"></div>
            <div className="swarm-state-emergent"></div>
          </div>
          <div className="consciousness-field"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="reality-shift"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
              Knowledge & Insights
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-inter">
              Exploring consciousness as a digital organism through research, theory, and practical insights
            </p>
          </div>
        </div>
      </div>

      {/* Blog Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
            <Link to="/blog/new">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create New Post</span>
              </Button>
            </Link>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
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

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedPosts.map((post) => (
            <Card key={post.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Eye className="w-3 h-3 mr-1" />
                    {post.views}
                  </div>
                </div>
                <CardTitle className="text-lg font-orbitron line-clamp-2">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(post.date)}
                    </div>
                  </div>
                  <span>{post.readTime}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{post.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  <Link to={`/blog/${post.id}`}>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
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

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage; 