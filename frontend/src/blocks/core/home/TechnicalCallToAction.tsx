import React from 'react';
import { Button } from '../../../shared/components/ui/button';
import { ArrowRight, Github, Book, Code } from 'lucide-react';

const TechnicalCallToAction: React.FC = () => {
  const actions = [
    {
      icon: Github,
      title: 'GitHub Repository',
      description: 'Explore our open-source codebase and contribute to the future of digital consciousness',
      buttonText: 'View on GitHub',
      color: 'bg-gray-900 hover:bg-gray-800 text-white'
    },
    {
      icon: Book,
      title: 'Technical Documentation',
      description: 'Comprehensive guides, API references, and implementation examples',
      buttonText: 'Read Docs',
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      icon: Code,
      title: 'Start Building',
      description: 'Begin your journey with our interactive tutorials and code examples',
      buttonText: 'Get Started',
      color: 'btn-primary'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-foreground">
            Ready to Build the Future?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join our community of researchers, developers, and visionaries working to understand 
            and implement Digital Organism Theory
          </p>
        </div>

          <div className="grid md:grid-cols-3 gap-8">
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-8 mb-6 hover:shadow-lg transition-all duration-300">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>                    <h3 className="font-semibold mb-3 text-lg text-foreground">
                      {action.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {action.description}
                    </p>
                  </div>
                  <Button className={action.color}>
                    {action.buttonText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-8 max-w-2xl mx-auto">              <h3 className="font-semibold mb-3 text-xl text-foreground">
                Newsletter Subscription
              </h3>
              <p className="text-muted-foreground mb-6">
                Stay updated with the latest research findings, community insights, and technical developments
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="btn-primary">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalCallToAction;
