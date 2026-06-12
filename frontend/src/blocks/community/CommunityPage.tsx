import { useState, useEffect } from 'react';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumInput,
  PremiumDropdown,
  PremiumMetric
} from '../../shared/components/ui/design-system-primitives';
import ReadingContainer from '../../shared/components/ui/reading-container';
import {
  MessageCircle,
  Users,
  Clock,
  User,
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
    const timer = setTimeout(() => {
      setDiscussions(demoDiscussions);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
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

  const getCategoryGlow = (cat: string): "primary" | "secondary" | "accent" | "success" | "none" => {
    switch (cat) {
      case 'consciousness': return 'primary';
      case 'digital-organisms': return 'secondary';
      case 'emergence': return 'accent';
      case 'philosophy': return 'success';
      default: return 'none';
    }
  };

  const getCategoryColorCode = (cat: string): string => {
    switch (cat) {
      case 'consciousness': return 'var(--primary)';
      case 'digital-organisms': return 'var(--secondary)';
      case 'emergence': return 'var(--accent)';
      case 'philosophy': return 'var(--secondary)';
      default: return 'var(--foreground)';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <PremiumText variant="vibrant" size="base">Decrypting community sub-network...</PremiumText>
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

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 animate-pulse">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>

            <PremiumTitle tag="h1" variant="gradient" className="mb-6 tracking-widest text-center justify-center">
              Stay Community Node
            </PremiumTitle>

            <PremiumText variant="vibrant" size="lg" className="mb-8 max-w-3xl mx-auto text-foreground/80">
              Join fellow operators and explorers in analyzing consciousness protocols, digital organisms,
              and the emergence of cybernetic intelligence. Share logs, sync frameworks, and link synapses.
            </PremiumText>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumButton variant="primary" glow shimmer icon={<Plus className="w-4 h-4" />}>
                Start Discussion
              </PremiumButton>
              <PremiumButton variant="glass" glow icon={<MessageCircle className="w-4 h-4" />}>
                Browse Topics
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="container mx-auto px-4 py-8">
        <ReadingContainer>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <PremiumMetric
              value="1,247"
              label="SYNAPSE PEERS"
              badge="MEMBERS"
              trend={{ direction: 'up', amount: '12.4%' }}
              glowColor="var(--primary)"
            />
            <PremiumMetric
              value="456"
              label="CONSCIOUS DISCUSSIONS"
              badge="THREADS"
              trend={{ direction: 'up', amount: '8.1%' }}
              glowColor="var(--secondary)"
            />
            <PremiumMetric
              value="2,891"
              label="RESONANCE LINKS"
              badge="REPLIES"
              trend={{ direction: 'up', amount: '24.2%' }}
              glowColor="var(--accent)"
            />
            <PremiumMetric
              value="24/7"
              label="UPTIME RATIO"
              badge="ACTIVE"
              glowColor="var(--secondary)"
            />
          </div>
        </ReadingContainer>
      </div>

      {/* Discussions */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
            <div className="flex-1 w-full">
              <PremiumInput
                label="QUERY DISCOURSE REGISTRY"
                badge="SEARCH"
                placeholder="Type keywords or tags to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end">
              <div className="w-full sm:w-64 text-left">
                <PremiumDropdown
                  label="FILTER BY METADATA CATEGORY"
                  options={categories.map(cat => ({
                    value: cat.id,
                    label: cat.id === 'all' ? 'All Discussions' : `${cat.name} (${cat.count})`
                  }))}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  glowColor="var(--secondary)"
                />
              </div>
              <PremiumButton
                variant="outline"
                className="w-full sm:w-auto h-10 shrink-0"
                icon={<Filter className="w-4 h-4" />}
              >
                Filters
              </PremiumButton>
            </div>
          </div>

          {/* Discussion List */}
          <div className="space-y-6">
            {filteredDiscussions.map((discussion) => {
              const categoryGlow = getCategoryGlow(discussion.category);
              const categoryColor = getCategoryColorCode(discussion.category);

              return (
                <PremiumGlassCard
                  key={discussion.id}
                  enable3D={true}
                  glowColor={categoryColor}
                  className="w-full"
                >
                  <div className="flex flex-col justify-between h-full">
                    {/* Top Row: Meta and Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <HighContrastBadge glowColor={categoryGlow}>
                          {discussion.category}
                        </HighContrastBadge>
                        <HighContrastBadge glowColor="none" className="lowercase">
                          @{discussion.author}
                        </HighContrastBadge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{discussion.lastActivity}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <PremiumTitle tag="h3" variant="solid" className="mb-2 group-hover:text-primary transition-colors cursor-pointer text-left">
                      {discussion.title}
                    </PremiumTitle>

                    {/* Content */}
                    <PremiumText variant="vibrant" size="sm" className="mb-4 text-left opacity-85 leading-relaxed">
                      {discussion.content}
                    </PremiumText>

                    {/* Tags List */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {discussion.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-muted-foreground select-none hover:text-foreground hover:border-white/20 transition-all cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Metadata & Tactical Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5 mt-auto">
                      <div className="flex items-center space-x-6 text-[11px] font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5" title="Replies in network">
                          <MessageCircle className="w-4 h-4 text-primary/75" />
                          <span className="font-extrabold text-foreground">{formatNumber(discussion.replies)}</span>
                          <span className="opacity-40">replies</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Viewer nodes">
                          <User className="w-4 h-4 text-secondary/75" />
                          <span className="font-extrabold text-foreground">{formatNumber(discussion.views)}</span>
                          <span className="opacity-40">nodes</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Likes/Approvals">
                          <Heart className="w-4 h-4 text-sky-500/75 animate-pulse" />
                          <span className="font-extrabold text-foreground">{formatNumber(discussion.likes)}</span>
                          <span className="opacity-40">approvals</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <PremiumButton variant="glass" size="sm" notched={false} className="h-8 w-8 p-0" icon={<Heart className="w-3.5 h-3.5" />} title="Approve payload">
                          {null}
                        </PremiumButton>
                        <PremiumButton variant="glass" size="sm" notched={false} className="h-8 w-8 p-0" icon={<Share2 className="w-3.5 h-3.5" />} title="Sync/Share node">
                          {null}
                        </PremiumButton>
                        <PremiumButton variant="glass" size="sm" notched={false} className="h-8 w-8 p-0" icon={<Bookmark className="w-3.5 h-3.5" />} title="Archive synapse">
                          {null}
                        </PremiumButton>
                      </div>
                    </div>
                  </div>
                </PremiumGlassCard>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredDiscussions.length === 0 && (
            <PremiumGlassCard className="text-center py-16 max-w-lg mx-auto mt-12" glowColor="var(--primary)">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <PremiumTitle tag="h3" variant="gradient" className="mb-2 tracking-widest text-center justify-center">
                Query Result Blank
              </PremiumTitle>
              <PremiumText variant="vibrant" size="sm" className="mb-6 max-w-sm mx-auto opacity-75">
                No active discourse matches your parameters. Clear your keywords or expand category definitions.
              </PremiumText>
              <div className="flex justify-center">
                <PremiumButton variant="primary" glow onClick={() => setSearchTerm('')}>
                  Flush Query
                </PremiumButton>
              </div>
            </PremiumGlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;