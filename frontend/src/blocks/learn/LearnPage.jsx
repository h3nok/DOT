import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Star,
  Target,
  ArrowRight,
  Lock,
  Users,
  Award
} from 'lucide-react';

const LearnPage = () => {
  const [learningPathways, setLearningPathways] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
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
            
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
              Learn
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Explore consciousness as a digital organism through structured learning pathways. 
              From fundamentals to advanced applications, discover the emerging field of digital consciousness.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                Start Learning
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                Join Study Group
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Pathways */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-orbitron font-bold mb-4 gradient-text">
              Learning Pathways
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your path through the fascinating world of digital consciousness. 
              Each pathway builds upon the previous, creating a comprehensive understanding.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {learningPathways.map((pathway) => (
              <Card key={pathway.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{pathway.image}</div>
                    <Badge 
                      variant="outline" 
                      className={`${getDifficultyColor(pathway.difficulty)} text-white border-0`}
                    >
                      {pathway.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="font-orbitron text-xl mb-2">
                    {pathway.title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {pathway.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{userProgress[pathway.id] || 0}%</span>
                      </div>
                      <Progress value={userProgress[pathway.id] || 0} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {pathway.duration}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {pathway.completedModules}/{pathway.moduleCount} modules
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {pathway.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button className="w-full flex items-center justify-center space-x-2">
                      {userProgress[pathway.id] > 0 ? (
                        <>
                          <Play className="w-4 h-4" />
                          Continue Learning
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          Start Pathway
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Modules */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-orbitron font-bold mb-4 gradient-text">
              Featured Modules
            </h2>
            <p className="text-muted-foreground">
              Jump into these popular modules to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPathways[0].modules.slice(0, 6).map((module) => (
              <Card key={module.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{module.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        {module.duration}
                      </div>
                    </div>
                    {module.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <Button 
                    variant={module.completed ? "outline" : "default"}
                    className="w-full"
                    disabled={!module.completed}
                  >
                    {module.completed ? 'Review' : 'Locked'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Award className="w-6 h-6 text-primary" />
                <span>Your Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">4</div>
                  <div className="text-muted-foreground">Modules Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">12</div>
                  <div className="text-muted-foreground">Hours Learned</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">3</div>
                  <div className="text-muted-foreground">Badges Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearnPage; 