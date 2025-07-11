import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/glass-card';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization?: string;
  content: string;
  rating: number;
  avatar?: string;
  featured?: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Dr. Elena Rodriguez',
    role: 'AI Research Scientist',
    organization: 'Stanford University',
    content: 'The Digital Organism Theory provides a revolutionary framework for understanding consciousness. This platform has transformed how we approach AI research and the fundamental nature of awareness.',
    rating: 5,
    featured: true
  },
  {
    id: '2',
    name: 'Marcus Chen',
    role: 'Cognitive Scientist',
    organization: 'MIT',
    content: 'DOT offers the most compelling unified theory of consciousness I\'ve encountered. The community here is exceptional - brilliant minds collaborating on humanity\'s deepest questions.',
    rating: 5,
    featured: true
  },
  {
    id: '3',
    name: 'Dr. Sarah Kim',
    role: 'Philosophy Professor',
    organization: 'Oxford University',
    content: 'This platform bridges the gap between theoretical philosophy and practical AI development. The insights here are profound and applicable.',
    rating: 5
  },
  {
    id: '4',
    name: 'Alex Thompson',
    role: 'AI Engineer',
    organization: 'DeepMind',
    content: 'The research tools and collaborative environment here are unmatched. DOT has become essential to my work in consciousness-driven AI.',
    rating: 5
  },
  {
    id: '5',
    name: 'Dr. James Wilson',
    role: 'Neuroscientist',
    organization: 'Harvard Medical',
    content: 'The interdisciplinary approach here is exactly what consciousness research needs. Brilliant insights from diverse perspectives.',
    rating: 5
  },
  {
    id: '6',
    name: 'Maria Santos',
    role: 'Research Director',
    organization: 'Google Research',
    content: 'DOT has fundamentally shifted how our team thinks about artificial consciousness. The practical applications are extraordinary.',
    rating: 5
  }
];

const TestimonialsSection: React.FC = () => {
  const featuredTestimonials = testimonials.filter(t => t.featured);
  const regularTestimonials = testimonials.filter(t => !t.featured);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < rating 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );

  return (
    <section className="py-24 bg-gradient-to-br from-background via-muted/5 to-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Trusted by Leading Researchers
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of scientists, philosophers, and innovators exploring the future of consciousness
          </p>
        </motion.div>

        {/* Featured Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
          {featuredTestimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <GlassCard className="p-8 h-full hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors">
                  <Quote className="w-12 h-12" />
                </div>
                
                <StarRating rating={testimonial.rating} />
                
                <blockquote className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </blockquote>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-lg font-medium text-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                      {testimonial.organization && (
                        <span className="text-primary"> • {testimonial.organization}</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Regular Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {regularTestimonials.map((testimonial) => (
            <GlassCard key={testimonial.id} className="p-6 hover:shadow-xl transition-all duration-300 group">
              <StarRating rating={testimonial.rating} />
              
              <blockquote className="text-muted-foreground leading-relaxed mb-4 text-sm">
                "{testimonial.content}"
              </blockquote>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-light mb-4 text-foreground">
              Join the Research Community
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Be part of the conversation shaping the future of consciousness research and AI development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/community"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-70"></div>
                  <button className="relative px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                    Join Community
                  </button>
                </div>
              </motion.a>
              <motion.a
                href="/learn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <button className="px-8 py-3 border border-border/50 text-foreground rounded-xl font-medium hover:bg-card/50 transition-colors">
                  Start Learning
                </button>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
