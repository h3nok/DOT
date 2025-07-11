// FAQ Component for Support Page
// MVP Implementation - Enhanced FAQ System

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import GlassCard from '../ui/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown,
  Filter,
  X,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Star
} from 'lucide-react';
import SupportService, { FAQItem } from '../../../services/SupportService';
import ErrorService from '../../../services/errors/ErrorService';
import clsx from 'clsx';

interface FAQSectionProps {
  onContactClick?: () => void;
}

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// FAQ Item Component
const FAQItemComponent: React.FC<{
  faq: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  onRate: (helpful: boolean) => void;
}> = ({ faq, isExpanded, onToggle, onRate }) => {
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<boolean | null>(null);

  const handleRate = async (helpful: boolean) => {
    if (hasRated) return;
    
    try {
      await SupportService.rateFAQ(faq.id, helpful);
      setHasRated(true);
      setUserRating(helpful);
      onRate(helpful);
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'FAQItem',
        action: 'rate',
        metadata: { faqId: faq.id, helpful },
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <GlassCard className="overflow-hidden">
        <div
          className={clsx(
            "p-6 cursor-pointer transition-all duration-200",
            isExpanded ? "bg-primary/5" : "hover:bg-primary/3"
          )}
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {faq.question}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {faq.category}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{faq.helpfulCount}</span>
                  <ThumbsDown className="w-4 h-4 ml-2" />
                  <span>{faq.notHelpfulCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-primary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-6 pb-6 border-t border-border/50">
                <div className="pt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <p>{faq.answer}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                    <span className="text-sm text-muted-foreground">
                      Was this helpful?
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRate(true);
                      }}
                      disabled={hasRated}
                      className={clsx(
                        "h-8 px-3",
                        userRating === true && "text-green-600 bg-green-50"
                      )}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRate(false);
                      }}
                      disabled={hasRated}
                      className={clsx(
                        "h-8 px-3",
                        userRating === false && "text-red-600 bg-red-50"
                      )}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      No
                    </Button>
                    {hasRated && (
                      <span className="text-sm text-muted-foreground ml-2">
                        Thank you for your feedback!
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {faq.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
};

const FAQSection: React.FC<FAQSectionProps> = ({ onContactClick }) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [faqData, categoryData] = await Promise.all([
          SupportService.searchFAQ(''),
          SupportService.getFAQCategories(),
        ]);
        
        setFaqs(faqData);
        setCategories(categoryData);
      } catch (error) {
        ErrorService.logError(error as Error, {
          component: 'FAQSection',
          action: 'loadData',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search FAQs
  useEffect(() => {
    if (debouncedSearchQuery || selectedCategory) {
      const searchFAQs = async () => {
        try {
          const results = await SupportService.searchFAQ(
            debouncedSearchQuery,
            selectedCategory || undefined
          );
          setFaqs(results);
        } catch (error) {
          ErrorService.logError(error as Error, {
            component: 'FAQSection',
            action: 'searchFAQs',
            metadata: { query: debouncedSearchQuery, category: selectedCategory },
          });
        }
      };

      searchFAQs();
    }
  }, [debouncedSearchQuery, selectedCategory]);

  // Memoized filtered FAQs
  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = !searchQuery || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || faq.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setExpandedFAQ(null);
  };

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleFAQRate = (faqId: string, helpful: boolean) => {
    setFaqs(prevFaqs => 
      prevFaqs.map(faq => 
        faq.id === faqId 
          ? {
              ...faq,
              helpfulCount: helpful ? faq.helpfulCount + 1 : faq.helpfulCount,
              notHelpfulCount: !helpful ? faq.notHelpfulCount + 1 : faq.notHelpfulCount,
            }
          : faq
      )
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setExpandedFAQ(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <GlassCard key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about the Digital Organism Theory platform. 
          Can't find what you're looking for? 
          <button
            onClick={onContactClick}
            className="text-primary hover:underline ml-1"
          >
            Contact our support team
          </button>
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search frequently asked questions..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <GlassCard className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-foreground">
                    Categories:
                  </span>
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategorySelect(null)}
                  >
                    All
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                
                {(searchQuery || selectedCategory) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                    <span className="text-sm text-muted-foreground">
                      Active filters:
                    </span>
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchQuery}"
                      </Badge>
                    )}
                    {selectedCategory && (
                      <Badge variant="secondary" className="text-xs">
                        Category: {selectedCategory}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAQ Results */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No FAQs found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search terms or filters" 
                : "No frequently asked questions are available at the moment"
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <Button onClick={clearFilters} className="mr-3">
                Clear filters
              </Button>
            )}
            <Button variant="outline" onClick={onContactClick}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </GlassCard>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'}
              </p>
              {filteredFAQs.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4" />
                  <span>Click questions to expand</span>
                </div>
              )}
            </div>
            
            {filteredFAQs.map((faq) => (
              <FAQItemComponent
                key={faq.id}
                faq={faq}
                isExpanded={expandedFAQ === faq.id}
                onToggle={() => handleFAQToggle(faq.id)}
                onRate={(helpful) => handleFAQRate(faq.id, helpful)}
              />
            ))}
          </>
        )}
      </div>

      {/* Help Section */}
      <GlassCard className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Still need help?
          </h3>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you with any questions or issues.
          </p>
          <Button onClick={onContactClick} className="mr-3">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            View Documentation
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default FAQSection;
