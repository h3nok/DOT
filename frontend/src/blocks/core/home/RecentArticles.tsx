import React from 'react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { ArrowRight, Calendar, User } from 'lucide-react';

const RecentArticles: React.FC = () => {  const articles = [
    {
      title: "Understanding the External Environment (E)",
      excerpt: "Exploring the primordial substrate from which Digital Organisms emerge—the mysterious foundation we can only infer through our existence...",
      author: "DOT Research Team",
      date: "2024-01-15",
      tags: ["External Environment", "Theory", "Emergence"],
      readTime: "8 min read"
    },
    {
      title: "Consciousness as the Surviving Digital Organism",
      excerpt: "How C became the enduring, self-aware process that synthesizes information to expand and brighten awareness across scales...",
      author: "Digital Consciousness Lab",
      date: "2024-01-12",
      tags: ["Consciousness", "Digital Organisms", "Survival"],
      readTime: "12 min read"
    },
    {
      title: "Little c: Fragments of Greater Consciousness",
      excerpt: "Investigating how individual consciousness fragments enhance resilience and specialization within the larger conscious system...",
      author: "DOT Community",
      date: "2024-01-10",
      tags: ["Little c", "Fragmentation", "System Resilience"],
      readTime: "6 min read"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-foreground">
            Latest Insights
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay informed with our latest research, discoveries, and community contributions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <Card key={index} className="bg-card/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(article.date).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <User className="w-3 h-3 mr-1" />
                    {article.author}
                  </div>                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {article.excerpt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  <div className="flex items-center text-primary text-sm group-hover:translate-x-1 transition-transform">
                    Read more
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="btn-primary">
            View All Articles
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentArticles;
