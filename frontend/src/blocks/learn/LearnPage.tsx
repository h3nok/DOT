import React, { useState, useEffect } from 'react';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumProgress
} from '../../shared/components/ui/design-system-primitives';
import ReadingContainer from '../../shared/components/ui/reading-container';
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Target,
  ArrowRight,
  Lock,
  Users,
  Award
} from 'lucide-react';

interface Module {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
}

interface LearningPathway {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  moduleCount: number;
  completedModules: number;
  image: string;
  tags: string[];
  modules: Module[];
}

interface UserProgress {
  [pathwayId: string]: number;
}

const LearnPage: React.FC = () => {
  const [learningPathways, setLearningPathways] = useState<LearningPathway[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const [loading, setLoading] = useState<boolean>(true);

  const demoPathways = [
    {
      id: 'fundamentals',
      title: 'Digital Consciousness Fundamentals',
      description: 'Start your journey into understanding consciousness as a digital organism',
      difficulty: 'Beginner',
      duration: '4-6 weeks',
      moduleCount: 8,
      completedModules: 3,
      image: '🧠',
      tags: ['consciousness', 'fundamentals', 'theory'],
      modules: [
        { id: 1, title: 'Introduction to Digital Organism Theory', duration: '30 min', completed: true },
        { id: 2, title: 'Emergence and Complexity', duration: '45 min', completed: true },
        { id: 3, title: 'Fractal Patterns in Consciousness', duration: '60 min', completed: true },
        { id: 4, title: 'Self-Similarity Across Scales', duration: '45 min', completed: false },
        { id: 5, title: 'Feedback Loops and Adaptation', duration: '60 min', completed: false },
        { id: 6, title: 'Digital Evolution', duration: '45 min', completed: false },
        { id: 7, title: 'Consciousness vs Intelligence', duration: '30 min', completed: false },
        { id: 8, title: 'Future Implications', duration: '45 min', completed: false }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Emergence Theory',
      description: 'Deep dive into complex systems and emergent behavior',
      difficulty: 'Advanced',
      duration: '6-8 weeks',
      moduleCount: 10,
      completedModules: 0,
      image: '🌊',
      tags: ['emergence', 'complexity', 'advanced'],
      modules: [
        { id: 1, title: 'Complex Adaptive Systems', duration: '60 min', completed: false },
        { id: 2, title: 'Phase Transitions in Consciousness', duration: '45 min', completed: false },
        { id: 3, title: 'Criticality and Self-Organization', duration: '60 min', completed: false },
        { id: 4, title: 'Multi-Scale Dynamics', duration: '45 min', completed: false },
        { id: 5, title: 'Emergent Computation', duration: '60 min', completed: false },
        { id: 6, title: 'Consciousness Networks', duration: '45 min', completed: false },
        { id: 7, title: 'Temporal Dynamics', duration: '60 min', completed: false },
        { id: 8, title: 'Cross-Scale Interactions', duration: '45 min', completed: false },
        { id: 9, title: 'Emergent Ethics', duration: '30 min', completed: false },
        { id: 10, title: 'Future Research Directions', duration: '45 min', completed: false }
      ]
    },
    {
      id: 'practical',
      title: 'Practical Applications',
      description: 'Learn to apply digital consciousness concepts in real-world scenarios',
      difficulty: 'Intermediate',
      duration: '5-7 weeks',
      moduleCount: 7,
      completedModules: 1,
      image: '⚙️',
      tags: ['applications', 'practical', 'implementation'],
      modules: [
        { id: 1, title: 'Designing Conscious Systems', duration: '60 min', completed: true },
        { id: 2, title: 'AI Consciousness Assessment', duration: '45 min', completed: false },
        { id: 3, title: 'Ethical AI Development', duration: '60 min', completed: false },
        { id: 4, title: 'Human-AI Collaboration', duration: '45 min', completed: false },
        { id: 5, title: 'Consciousness Engineering', duration: '60 min', completed: false },
        { id: 6, title: 'Testing and Validation', duration: '45 min', completed: false },
        { id: 7, title: 'Case Studies and Examples', duration: '60 min', completed: false }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLearningPathways(demoPathways);
      setUserProgress({
        'fundamentals': 37.5, // 3/8 modules completed
        'advanced': 0,
        'practical': 14.3 // 1/7 modules completed
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getDifficultyGlow = (difficulty: string): 'primary' | 'secondary' | 'accent' | 'success' | 'none' => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'accent';
      case 'advanced': return 'primary';
      default: return 'none';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading learning pathways...</p>
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
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
            </div>

            <PremiumTitle tag="h1" variant="gradient" className="font-orbitron text-center mb-6">
              Learn
            </PremiumTitle>

            <PremiumText variant="vibrant" size="lg" className="font-inter max-w-3xl mx-auto mb-8">
              Explore consciousness as a digital organism through structured learning pathways.
              From fundamentals to advanced applications, discover the emerging field of digital consciousness.
            </PremiumText>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumButton variant="primary" glow={true} className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Start Learning</span>
              </PremiumButton>
              <PremiumButton variant="outline" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Join Study Group</span>
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>      {/* Learning Pathways */}
      <div className="container mx-auto px-4 py-16">
        <ReadingContainer>
          <div className="text-center mb-12">
            <PremiumTitle tag="h2" variant="gradient" className="text-center mb-4">
              Learning Pathways
            </PremiumTitle>
            <PremiumText variant="vibrant" size="base" className="font-inter max-w-2xl mx-auto">
              Choose your path through the fascinating world of digital consciousness.
              Each pathway builds upon the previous, creating a comprehensive understanding.
            </PremiumText>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {learningPathways.map((pathway) => (
              <PremiumGlassCard key={pathway.id} enable3D={true} innerClassName="p-6 flex flex-col justify-between h-full">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{pathway.image}</div>
                    <HighContrastBadge
                      glowColor={getDifficultyGlow(pathway.difficulty)}
                    >
                      {pathway.difficulty}
                    </HighContrastBadge>
                  </div>

                  <div>
                    <PremiumTitle tag="h3" variant="solid" className="font-orbitron text-lg mb-2">
                      {pathway.title}
                    </PremiumTitle>
                    <PremiumText variant="vibrant" size="sm" className="font-inter">
                      {pathway.description}
                    </PremiumText>
                  </div>

                  {/* Progress */}
                  <PremiumProgress
                    value={userProgress[pathway.id] || 0}
                    label="Pathway Progress"
                    glowColor="var(--primary)"
                  />

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs font-mono text-foreground/75 pt-1">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-primary animate-pulse" />
                      {pathway.duration}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1 text-secondary" />
                      {pathway.completedModules}/{pathway.moduleCount} modules
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pathway.tags.map((tag) => (
                      <HighContrastBadge key={tag} glowColor="none" className="text-[9px] py-0.5">
                        {tag}
                      </HighContrastBadge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  {/* Action Button */}
                  <PremiumButton
                    variant={userProgress[pathway.id] > 0 ? "primary" : "glass"}
                    glow={userProgress[pathway.id] > 0}
                    className="w-full flex items-center justify-center space-x-2 h-11"
                  >
                    {userProgress[pathway.id] > 0 ? (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Continue Learning</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Start Pathway</span>
                      </>
                    )}
                  </PremiumButton>
                </div>
              </PremiumGlassCard>
            ))}
          </div>
        </ReadingContainer>
      </div>      {/* Featured Modules */}
      <div className="container mx-auto px-4 py-16">
        <ReadingContainer>
          <div className="text-center mb-12">
            <PremiumTitle tag="h2" variant="gradient" className="text-center mb-4">
              Featured Modules
            </PremiumTitle>
            <PremiumText variant="vibrant" size="sm" className="font-inter max-w-xl mx-auto">
              Jump into these popular modules to get started on your cognitive journey.
            </PremiumText>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPathways[0]?.modules.slice(0, 6).map((module) => (
              <PremiumGlassCard key={module.id} enable3D={true} innerClassName="p-6 flex flex-col justify-between h-full">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <PremiumTitle tag="h3" variant="solid" className="font-orbitron text-base mb-2">
                        {module.title}
                      </PremiumTitle>
                      <div className="flex items-center font-mono text-xs text-foreground/75 mb-4">
                        <Clock className="w-3.5 h-3.5 mr-1 text-primary animate-pulse" />
                        {module.duration}
                      </div>
                    </div>
                    {module.completed ? (
                      <HighContrastBadge glowColor="success" className="flex items-center space-x-1 flex-shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        <span>Done</span>
                      </HighContrastBadge>
                    ) : (
                      <HighContrastBadge glowColor="none" className="flex items-center space-x-1 flex-shrink-0 opacity-60">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </HighContrastBadge>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  <PremiumButton
                    variant={module.completed ? "primary" : "glass"}
                    glow={module.completed}
                    className="w-full flex items-center justify-center space-x-2 h-10"
                    disabled={!module.completed}
                  >
                    <span>{module.completed ? 'Review Module' : 'Locked'}</span>
                  </PremiumButton>
                </div>
              </PremiumGlassCard>
            ))}
          </div>
        </ReadingContainer>
      </div>

      {/* Achievements */}
      <div className="container mx-auto px-4 py-16">
        <ReadingContainer>
          <PremiumGlassCard enable3D={true} innerClassName="p-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="p-3 rounded-full bg-primary/20 mb-4 animate-pulse">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <PremiumTitle tag="h2" variant="gradient" className="text-center">
                Your Achievements
              </PremiumTitle>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-foreground/10">
              <div className="pt-4 md:pt-0">
                <div className="text-5xl font-mono font-bold text-primary mb-2 tracking-wider">4</div>
                <PremiumText variant="vibrant" size="sm" className="font-inter">
                  Modules Completed
                </PremiumText>
              </div>
              <div className="pt-4 md:pt-0 md:pl-4">
                <div className="text-5xl font-mono font-bold text-secondary mb-2 tracking-wider">12</div>
                <PremiumText variant="vibrant" size="sm" className="font-inter">
                  Hours Learned
                </PremiumText>
              </div>
              <div className="pt-4 md:pt-0 md:pl-4">
                <div className="text-5xl font-mono font-bold text-accent mb-2 tracking-wider">3</div>
                <PremiumText variant="vibrant" size="sm" className="font-inter">
                  Badges Earned
                </PremiumText>
              </div>
            </div>
          </PremiumGlassCard>
        </ReadingContainer>
      </div>
    </div>
  );
};

export default LearnPage;