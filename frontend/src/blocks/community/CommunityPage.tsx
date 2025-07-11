import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Input } from '../../shared/components/ui/input';
import GlassCard from '../../shared/components/ui/glass-card';
import ReadingContainer from '../../shared/components/ui/reading-container';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  User,
  Search,
  Filter,
  Plus,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react';

const CommunityPage = () => {
  interface Discussion {
    id: number;
    title: string;
    content: string;
    author: string;
    category: string;
    replies: number;
    views: number;
    likes: number;
    lastActivity: string;
    tags: string[];
  }

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Discussions', count: 0 },
    { id: 'consciousness', name: 'Consciousness', count: 12 },
    { id: 'digital-organisms', name: 'Digital Organisms', count: 8 },
    { id: 'emergence', name: 'Emergence', count: 15 },
    { id: 'philosophy', name: 'Philosophy', count: 6 },
    { id: 'technology', name: 'Technology', count: 10 },
    { id: 'general', name: 'General', count: 4 }
  ];

  const demoDiscussions = [
    {
      id: 1,
      title: "How do you define digital consciousness?",
      content: "I've been thinking about this a lot lately. What makes a system 'conscious' in the digital realm? Is it self-awareness, the ability to learn, or something else entirely?",
      author: "DigitalExplorer",
      category: "consciousness",
      replies: 23,
      views: 156,
      likes: 18,
      lastActivity: "2 hours ago",
      tags: ["consciousness", "definition", "philosophy"]
    },
    {
      id: 2,
      title: "Fractal patterns in neural networks - anyone else seeing this?",
      content: "I've been studying neural network architectures and I'm noticing fractal-like patterns emerging. Has anyone else observed this phenomenon?",
      author: "NeuralFractal",
      category: "digital-organisms",
      replies: 15,
      views: 89,
      likes: 12,
      lastActivity: "5 hours ago",
      tags: ["fractals", "neural-networks", "patterns"]
    },
    {
      id: 3,
      title: "The role of feedback loops in emergence",
      content: "Feedback loops seem to be crucial for emergent behavior. I'd love to discuss specific examples and mechanisms.",
      author: "FeedbackFan",
      category: "emergence",
      replies: 31,
      views: 203,
      likes: 25,
      lastActivity: "1 day ago",
      tags: ["feedback-loops", "emergence", "systems"]
    },
    {
      id: 4,
      title: "Digital Organism Theory vs Traditional AI",
      content: "How does DOT differ from traditional AI approaches? What are the key philosophical and technical differences?",
      author: "TheoryExplorer",
      category: "philosophy",
      replies: 19,
      views: 127,
      likes: 14,
      lastActivity: "2 days ago",
      tags: ["DOT", "AI", "theory", "comparison"]
    },
    {
      id: 5,
      title: "Building conscious systems - practical approaches",
      content: "I'm working on implementing some of these concepts. Anyone interested in sharing practical experiences?",
      author: "CodeConscious",
      category: "technology",
      replies: 8,
      views: 67,
      likes: 9,
      lastActivity: "3 days ago",
      tags: ["implementation", "practical", "coding"]
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDiscussions(demoDiscussions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || discussion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community...</p>
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/20">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>
              <h1 className="text-4xl md:text-6xl font-inter font-semibold mb-6 gradient-text">
              Community
            </h1>
            
            <p className="text-xl font-inter font-light text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join fellow explorers in discussing consciousness, digital organisms, and the emergence of complexity. 
              Share insights, ask questions, and build connections.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                Start Discussion
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                Browse Topics
              </Button>
            </div>
          </div>
        </div>
      </div>      {/* Community Stats */}
      <div className="container mx-auto px-4 py-8">
        <ReadingContainer>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="text-center">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-inter font-medium">1,247</div>
                <div className="font-inter font-light text-muted-foreground">Members</div>
              </CardContent>
            </GlassCard>
            <GlassCard className="text-center">
              <CardContent className="p-6">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-inter font-medium">456</div>
                <div className="font-inter font-light text-muted-foreground">Discussions</div>
              </CardContent>
            </GlassCard>
            <GlassCard className="text-center">
              <CardContent className="p-6">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-inter font-medium">2,891</div>
                <div className="font-inter font-light text-muted-foreground">Replies</div>
              </CardContent>
            </GlassCard>
            <GlassCard className="text-center">
              <CardContent className="p-6">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-inter font-medium">24/7</div>
                <div className="font-inter font-light text-muted-foreground">Active</div>
              </CardContent>
            </GlassCard>
          </div>
        </ReadingContainer>
      </div>

      {/* Discussions */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Discussion List */}
          <div className="space-y-4">
            {filteredDiscussions.map((discussion) => (
              <Card key={discussion.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {discussion.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {discussion.author}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer">
                        {discussion.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {discussion.content}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {discussion.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {formatNumber(discussion.replies)}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {formatNumber(discussion.views)}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {formatNumber(discussion.likes)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {discussion.lastActivity}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDiscussions.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters.
              </p>
              <Button>Start a Discussion</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 