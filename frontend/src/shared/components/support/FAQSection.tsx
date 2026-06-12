// FAQ Component for Support Page
// Premium Design System Refactor

import React, { useState, useEffect, useMemo } from 'react';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumInput
} from '../ui/design-system-primitives';
import { motion, AnimatePresence } from 'framer-motion';
import {
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

  const getCategoryGlow = (cat: string): "primary" | "secondary" | "accent" | "success" | "none" => {
    switch (cat.toLowerCase()) {
      case 'general': return 'success';
      case 'account': return 'secondary';
      case 'billing': return 'accent';
      case 'technical': return 'primary';
      default: return 'none';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <PremiumGlassCard className="overflow-hidden p-0" enable3D={false} glowColor={isExpanded ? "var(--primary)" : undefined}>
        <div
          className={clsx(
            "p-6 cursor-pointer transition-all duration-300 select-none text-left w-full",
            isExpanded ? "bg-primary/5" : "hover:bg-primary/[0.02]"
          )}
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <PremiumTitle tag="h3" variant="solid" className="mb-2 tracking-wide font-bold normal-case text-foreground text-left">
                {faq.question}
              </PremiumTitle>
              <div className="flex flex-wrap items-center gap-3">
                <HighContrastBadge glowColor={getCategoryGlow(faq.category)}>
                  {faq.category}
                </HighContrastBadge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-foreground/80">{faq.helpfulCount}</span>
                  <ThumbsDown className="w-3.5 h-3.5 text-sky-400 ml-2" />
                  <span className="font-semibold text-foreground/80">{faq.notHelpfulCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/[0.04] border border-white/5 group-hover:border-white/10 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="px-6 pb-6 border-t border-white/5 bg-black/[0.05]">
                <div className="pt-5 text-left">
                  <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans opacity-95">
                    <p>{faq.answer}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        Was this helpful?
                      </span>
                      <PremiumButton
                        variant={userRating === true ? "primary" : "glass"}
                        size="sm"
                        notched={false}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleRate(true);
                        }}
                        disabled={hasRated}
                        className="h-8 px-3.5"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                        Yes
                      </PremiumButton>
                      <PremiumButton
                        variant={userRating === false ? "primary" : "glass"}
                        size="sm"
                        notched={false}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleRate(false);
                        }}
                        disabled={hasRated}
                        className="h-8 px-3.5"
                      >
                        <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                        No
                      </PremiumButton>
                      {hasRated && (
                        <span className="text-xs font-mono text-emerald-400 ml-2 animate-pulse">
                          Feedback committed.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                      {faq.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all select-none cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PremiumGlassCard>
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
      <div className="space-y-4 max-w-4xl mx-auto">
        {[...Array(5)].map((_, i) => (
          <PremiumGlassCard key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </PremiumGlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 border border-primary/25 rounded-lg">
            <HelpCircle className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <PremiumTitle tag="h2" variant="gradient">
            KNOWLEDGE BASE DIRECTORY
          </PremiumTitle>
        </div>
        <PremiumText variant="vibrant" size="base" className="max-w-2xl mx-auto text-foreground/80">
          Find instant resolutions to common queries regarding the DOT network protocols. Still lost?
          <button
            onClick={onContactClick}
            className="text-primary hover:underline ml-1.5 font-bold font-mono text-xs tracking-wider"
          >
            RESOLVE VIA OPERATOR SYNAPSE &gt;
          </button>
        </PremiumText>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 w-full">
            <PremiumInput
              id="searchFAQ"
              placeholder="Search frequently asked questions..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
          <PremiumButton
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-10 select-none shrink-0"
            icon={<Filter className="w-4 h-4" />}
          >
            Filters
          </PremiumButton>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <PremiumGlassCard className="p-5" glowColor="var(--primary)">
                <div className="flex flex-wrap items-center gap-2 text-left mb-4">
                  <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-foreground/80 mr-2">
                    CATEGORIES:
                  </span>
                  <PremiumButton
                    variant={selectedCategory === null ? "primary" : "outline"}
                    size="sm"
                    notched={false}
                    onClick={() => handleCategorySelect(null)}
                    className="h-8 py-0 px-3 text-[10px]"
                  >
                    ALL
                  </PremiumButton>
                  {categories.map(category => (
                    <PremiumButton
                      key={category}
                      variant={selectedCategory === category ? "primary" : "outline"}
                      size="sm"
                      notched={false}
                      onClick={() => handleCategorySelect(category)}
                      className="h-8 py-0 px-3 text-[10px]"
                    >
                      {category}
                    </PremiumButton>
                  ))}
                </div>

                {(searchQuery || selectedCategory) && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5 text-left">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">
                      Active Filters:
                    </span>
                    {searchQuery && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-primary">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-secondary">
                        Category: {selectedCategory}
                      </span>
                    )}
                    <PremiumButton
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-[10px] hover:text-sky-500 font-bold ml-auto"
                      icon={<X className="w-3 h-3" />}
                    >
                      Clear
                    </PremiumButton>
                  </div>
                )}
              </PremiumGlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAQ Results */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <PremiumGlassCard className="p-12 text-center" glowColor="var(--primary)">
            <BookOpen className="w-16 h-16 text-muted-foreground/55 mx-auto mb-4 animate-bounce" />
            <PremiumTitle tag="h3" variant="gradient" className="mb-2 tracking-wider text-center justify-center">
              NO DIRECT MATCHES
            </PremiumTitle>
            <PremiumText variant="vibrant" size="sm" className="mb-6 max-w-sm mx-auto opacity-75">
              No matching knowledge protocols were found matching your query details. Try resetting filters or forwarding to live support.
            </PremiumText>

            <div className="flex justify-center gap-3">
              {(searchQuery || selectedCategory) && (
                <PremiumButton onClick={clearFilters} variant="outline">
                  Reset Filters
                </PremiumButton>
              )}
              <PremiumButton variant="primary" glow onClick={onContactClick} icon={<MessageSquare className="w-4 h-4" />}>
                Contact Support
              </PremiumButton>
            </div>
          </PremiumGlassCard>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 font-mono text-[10px] sm:text-xs">
              <span className="text-muted-foreground">
                Showing <strong className="text-foreground">{filteredFAQs.length}</strong> matching entries
              </span>
              {filteredFAQs.length > 0 && (
                <span className="text-muted-foreground/60 flex items-center gap-1 select-none">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  <span>Interactive accordion list</span>
                </span>
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
      <PremiumGlassCard className="p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5 mt-12" glowColor="var(--secondary)">
        <PremiumTitle tag="h3" variant="gradient" className="mb-2 text-center justify-center">
          PERSISTENT KNOWLEDGE INQUIRIES
        </PremiumTitle>
        <PremiumText variant="vibrant" size="sm" className="mb-6 max-w-lg mx-auto opacity-75">
          Can't locate structural specifications? Connect dynamically to our support node or consult our cryptographic documentation.
        </PremiumText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <PremiumButton onClick={onContactClick} variant="primary" glow icon={<MessageSquare className="w-4 h-4" />}>
            Open Operator Synapse
          </PremiumButton>
          <PremiumButton variant="glass" icon={<BookOpen className="w-4 h-4" />}>
            Platform Ledger Docs
          </PremiumButton>
        </div>
      </PremiumGlassCard>
    </div>
  );
};

export default FAQSection;
