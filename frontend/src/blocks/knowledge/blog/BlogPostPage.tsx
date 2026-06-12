import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Sliders,
  Brain,
  Music,
  Volume2,
  VolumeX,
  Check,
  Type,
  Activity
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import EnhancedMarkdown from '../../../shared/components/ui/EnhancedMarkdown';
import { AquaticBackground } from '../../../shared/components/ui/aquatic-background';
import FloatingNav from '../../../shared/components/ui/floating-nav';
import GlassCard from '../../../shared/components/ui/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { blogPostsData } from '../../../content/blog/postsData';
import { useTheme } from '../../../shared/contexts/SimpleThemeContext';
import soundscape, { SoundscapeType } from '../../../services/SoundscapeService';

const BlogPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const { theme, setTheme } = useTheme();

  // Cognitive Reader States
  const [immersive, setImmersive] = useState(false);
  const [fontSize] = useState<'text-lg' | 'text-xl'>('text-lg');
  const [showTOC] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showConfig, setShowConfig] = useState(false);

  // Cognitive Retention States
  const [bionicMode, setBionicMode] = useState(false);
  const [focalMask, setFocalMask] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundscapeType>('off');
  const [volume, setVolume] = useState(0.4);

  // Knowledge Anchors States
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [anchoredSections, setAnchoredSections] = useState<Array<{ id: string; text: string; articleTitle: string }>>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const post = blogPostsData.find((p) => p.id === id);
  const currentIdx = blogPostsData.findIndex((p) => p.id === id);
  const prevPost = blogPostsData[currentIdx - 1];
  const nextPost = blogPostsData[currentIdx + 1];

  // Core life cycles
  useEffect(() => {
    window.scrollTo(0, 0);
    // Load anchored nodes from local storage
    const saved = localStorage.getItem('stay_anchored_nodes');
    if (saved) {
      try {
        setAnchoredSections(JSON.parse(saved));
      } catch (e) {}
    }

    // Stop soundscape when unmounting (crucial clean up)
    return () => {
      soundscape.stop();
    };
  }, [id]);

  // Handle soundscape settings
  useEffect(() => {
    soundscape.setVolume(volume);
  }, [volume]);

  // Calculate reading progress dynamically
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.pageYOffset / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Text selection listener for knowledge anchors
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelection(null);
        return;
      }

      // Ensure selection is inside the article content
      const container = document.getElementById('article-content-prose');
      if (!container || !container.contains(sel.anchorNode)) {
        setSelection(null);
        return;
      }

      // Avoid catching code blocks or mathematical equations
      const nodeType = sel.anchorNode?.parentElement?.tagName;
      if (nodeType === 'CODE' || nodeType === 'PRE' || nodeType === 'SPAN' && sel.anchorNode?.parentElement?.className.includes('katex')) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text: sel.toString().trim(),
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 50 // 50px above selection line
      });
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, []);

  if (!post) {
    return (
      <AquaticBackground className="flex items-center justify-center min-h-screen">
        <GlassCard className="p-8 text-center max-w-md border-white/10 dark:border-white/5 space-y-4 shadow-xl">
          <p className="text-xl font-bold font-orbitron text-foreground tracking-tight">Document node not found</p>
          <p className="text-sm text-muted-foreground leading-relaxed">The requested blog post index is invalid or has been relocated to another sub-layer.</p>
          <Link to="/blog">
            <Button variant="outline" className="rounded-xl border-white/10 font-mono text-xs tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Corpus
            </Button>
          </Link>
        </GlassCard>
      </AquaticBackground>
    );
  }

  // Table of Contents based on headings
  const toc =
    (post.content.match(/^#+ .+/gm) ?? []).map((line, i) => ({
      text: line.replace(/^#+ /, ''),
      id: `toc-${i}`,
    })) || [];

  // Toggle procedural soundscape
  const handleSoundToggle = (type: SoundscapeType) => {
    setActiveSound(type);
    soundscape.start(type);
  };

  // Anchor selection to Digital Twin
  const handleAnchorSelection = () => {
    if (!selection) return;

    const textToAnchor = selection.text;
    const wordCount = textToAnchor.split(/\s+/).length;

    // Constraint: avoid short/word selections
    if (wordCount < 4) {
      setNotification('Please select a longer phrase (minimum 4 words) to establish a coherent knowledge anchor.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const newAnchor = {
      id: `anch-${Date.now()}`,
      text: textToAnchor,
      label: textToAnchor.split(/\s+/).slice(0, 3).join(' ') + '...',
      articleId: id,
      articleTitle: post.title,
      timestamp: Date.now()
    };

    // Save locally
    const saved = localStorage.getItem('stay_anchored_nodes');
    let updated = [newAnchor];
    if (saved) {
      try {
        updated = [...JSON.parse(saved), newAnchor];
      } catch (e) {}
    }
    setAnchoredSections(updated);
    localStorage.setItem('stay_anchored_nodes', JSON.stringify(updated));

    // Show beautiful success banner
    setNotification(`[🧠 INGESTION] Knowledge anchored to Digital Twin graph: "${newAnchor.label}"`);
    setTimeout(() => setNotification(null), 5000);

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  // Get matching highlighted sentences for the current post
  const activeAnchoredTexts = anchoredSections
    .filter(anch => anch.articleTitle === post.title)
    .map(anch => anch.text);

  // Available themes list
  const THEME_OPTIONS = [
    { key: 'light', name: 'Alabaster Matte', bg: 'bg-[#fcfbf9]', border: 'border-[#eae6df]' },
    { key: 'dark', name: 'Midnight Obsidian', bg: 'bg-[#10111a]', border: 'border-[#1b1c2b]' }
  ];

  return (
    <AquaticBackground
      className={clsx(
        'py-16 md:py-24 transition-all duration-1000 relative min-h-screen',
        immersive && '!bg-[#020617]'
      )}
      showGrid={!immersive}
    >
      {/* CSS encapsulated styles for Focal Mask Mode */}
      <style>{`
        /* Dynamic Focal Mask Transitions */
        .focal-mask-active .prose p,
        .focal-mask-active .prose li,
        .focal-mask-active .prose blockquote {
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
          filter: blur(0.4px) saturate(85%);
          opacity: 0.25;
        }

        .focal-mask-active .prose p:hover,
        .focal-mask-active .prose li:hover,
        .focal-mask-active .prose blockquote:hover {
          opacity: 1 !important;
          filter: blur(0px) saturate(100%) !important;
          transform: translateX(4px);
        }

        /* Standby state when mouse not on the content card */
        .focal-mask-active .prose:not(:hover) p,
        .focal-mask-active .prose:not(:hover) li,
        .focal-mask-active .prose:not(:hover) blockquote {
          opacity: 1;
          filter: blur(0px) saturate(100%);
          transform: none;
        }
      `}</style>

      {/* Reading Progress Bar (Zero haziness glowing strip) */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[150] bg-black/10 dark:bg-black/40">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
          style={{ width: `${scrollProgress}%` }}
          layoutId="reading-progress-indicator"
        />
      </div>

      {/* Persistent floating notification alerts */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-lg w-[90%] px-5 py-3 rounded-2xl bg-neutral-900/90 text-white backdrop-blur-xl border border-sky-500/30 shadow-[0_12px_40px_rgba(37,99,235,0.25)] flex items-start gap-3"
          >
            <Brain className="w-5 h-5 text-sky-500 shrink-0 mt-0.5 animate-pulse-glow" />
            <div className="flex-1 text-xs font-mono leading-relaxed text-left text-neutral-200">
              {notification}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Contrast selection popup tool */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            style={{ left: selection.x, top: selection.y }}
            className="absolute z-[100] -translate-x-1/2 flex items-center bg-sky-600/95 hover:bg-sky-500 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.45)] border border-sky-400/20 text-xs font-mono tracking-wider cursor-pointer gap-2 transition-all active:scale-95 select-none"
            onClick={handleAnchorSelection}
          >
            <Brain className="w-4 h-4 text-sky-200 animate-pulse" />
            <span className="font-semibold">Anchor to Twin</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 max-w-5xl relative z-10">

        {/* Dynamic Controls sticky capsule bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-6 z-40 mb-10"
        >
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-background/70 dark:bg-black/45 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.2)] max-w-3xl mx-auto overflow-hidden">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className={clsx(
                    "h-8 px-3 rounded-full text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors",
                    showConfig ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Cognitive Instrument Panel</span>
                </Button>

                <div className="h-4 w-px bg-white/10 hidden sm:block mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImmersive((i) => !i)}
                  className={clsx(
                    "text-xs font-mono uppercase tracking-wider h-8 px-3 rounded-full transition-colors hidden sm:flex",
                    immersive ? "text-primary bg-white/5" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  Atmosphere: {immersive ? 'Active' : 'Off'}
                </Button>
              </div>

              <Link to="/blog">
                <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-xs font-mono border-white/10 hover:border-primary/30 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Corpus</span>
                </Button>
              </Link>
            </div>

            {/* Expandable Cognitive Instrument Drawer */}
            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-white/5 dark:border-white/5 bg-black/[0.04] dark:bg-black/35 px-6 py-5 flex flex-col md:flex-row gap-6 justify-between text-left"
                >
                  {/* Theme Comfort Selection */}
                  <div className="flex-1 space-y-2.5 min-w-[200px]">
                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <Type className="w-3 h-3 text-primary" />
                      <span>Comfort Themes</span>
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setTheme(opt.key)}
                          title={opt.name}
                          className={clsx(
                            "w-7 h-7 rounded-full border cursor-pointer relative flex items-center justify-center transition-all hover:scale-110",
                            opt.bg,
                            opt.border,
                            theme === opt.key ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80"
                          )}
                        >
                          {theme === opt.key && (
                            <Check className={clsx("w-3.5 h-3.5", opt.key === 'light' || opt.key === 'paper' ? "text-black" : "text-white")} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scientific Focus Modules */}
                  <div className="flex-1 space-y-2.5 min-w-[200px]">
                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3 text-sky-500" />
                      <span>Retention Modules</span>
                    </h4>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-mono text-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bionicMode}
                          onChange={(e) => setBionicMode(e.target.checked)}
                          className="rounded border-white/20 bg-black/20 text-sky-600 focus:ring-sky-500/30 w-4 h-4"
                        />
                        <span className={clsx(bionicMode ? "text-foreground font-semibold" : "text-muted-foreground")}>
                          Bionic Fixation (Bolding)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-mono text-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={focalMask}
                          onChange={(e) => setFocalMask(e.target.checked)}
                          className="rounded border-white/20 bg-black/20 text-sky-600 focus:ring-sky-500/30 w-4 h-4"
                        />
                        <span className={clsx(focalMask ? "text-foreground font-semibold" : "text-muted-foreground")}>
                          Active Focal Mask (Dimming)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Binaural Soundscapes */}
                  <div className="flex-1 space-y-2.5 min-w-[240px]">
                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <Music className="w-3 h-3 text-blue-500" />
                      <span>Procedural Audio</span>
                    </h4>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(['off', 'alpha', 'gamma', 'ocean'] as const).map((sound) => (
                          <Button
                            key={sound}
                            variant={activeSound === sound ? 'default' : 'outline'}
                            onClick={() => handleSoundToggle(sound)}
                            className="h-6 px-2.5 text-[9px] font-mono uppercase tracking-wider rounded-md"
                          >
                            {sound === 'off' ? 'Mute' : sound === 'alpha' ? 'Alpha (10Hz)' : sound === 'gamma' ? 'Gamma (40Hz)' : 'Ocean Tide'}
                          </Button>
                        ))}
                      </div>

                      {/* Sound volume slider slider */}
                      {activeSound !== 'off' && (
                        <div className="flex items-center gap-2">
                          {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5 text-primary" />}
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">
                            {Math.round(volume * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Article Title Header Panel */}
        <div className="max-w-3xl mx-auto flex flex-col gap-4 mb-10 text-left">
          <div className="flex items-center gap-2">
            <Badge variant="pulse">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Published Essay</span>
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {post.readTime} min read
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-orbitron font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            {post.title}
          </motion.h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-2 border-b border-white/5 pb-4">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.publishedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-accent" />
              {post.views} Views
            </span>
          </div>
        </div>

        {/* Main Body Grid (TOC + Article Content Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Table of Contents Floating Left Panel */}
          {showTOC && toc.length > 0 && (
            <nav className="hidden lg:block lg:col-span-3 lg:sticky lg:top-28 text-left font-mono">
              <GlassCard variant="subtle" className="p-4 border-white/10 dark:border-white/5 shadow-md">
                <h3 className="font-orbitron font-extrabold text-xs text-muted-foreground tracking-widest uppercase mb-4 border-b border-white/5 pb-2">
                  Contents
                </h3>
                <ul className="space-y-2.5 text-[11px] leading-relaxed">
                  {toc.map((item, i) => (
                    <li key={item.id} className="transition-all duration-200">
                      <a
                        href={`#${item.id}`}
                        className="hover:text-primary text-muted-foreground block transition-colors tracking-wide hover:translate-x-1 duration-200"
                      >
                        <span className="text-primary/60 mr-1">0{i+1}.</span> {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </nav>
          )}

          {/* Article Body Glass Card Container */}
          <div className={clsx(showTOC && toc.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12', 'w-full')}>
            <GlassCard
              variant="bright"
              className={clsx(
                "p-6 sm:p-10 md:p-12 border-white/10 dark:border-white/5 shadow-2xl relative bg-card/75 backdrop-blur-xl rounded-2xl transition-all duration-300",
                focalMask && "focal-mask-active"
              )}
            >
              <div id="article-content-prose" className="prose psky-lg dark:psky-invert max-w-none text-left">
                <EnhancedMarkdown
                  content={post.content}
                  allowMath={true}
                  allowCodeHighlight={true}
                  maxWidth="full"
                  fontSize={fontSize === 'text-lg' ? 'base' : 'lg'}
                  lineHeight="relaxed"
                  bionicMode={bionicMode}
                  anchors={activeAnchoredTexts}
                  className="psky-headings:font-orbitron psky-headings:font-bold psky-p:font-light psky-p:text-muted-foreground psky-a:text-primary hover:psky-a:text-primary/80 psky-code:rounded-md psky-code:bg-black/30 psky-code:px-1.5 psky-code:py-0.5"
                />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Pre / Next Document Nodes Map Footer */}
        <div className="max-w-3xl mx-auto flex items-center justify-between mt-12 pt-8 border-t border-white/5">
          {prevPost ? (
            <Link to={`/blog/${prevPost.id}`}>
              <Button variant="ghost" className="rounded-xl flex items-center gap-1.5 hover:bg-white/5 font-mono text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                <span>Previous: {prevPost.title.slice(0, 15)}...</span>
              </Button>
            </Link>
          ) : (
            <span />
          )}
          {nextPost ? (
            <Link to={`/blog/${nextPost.id}`}>
              <Button variant="ghost" className="rounded-xl flex items-center gap-1.5 hover:bg-white/5 font-mono text-xs text-muted-foreground hover:text-foreground">
                <span>Next: {nextPost.title.slice(0, 15)}...</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      <FloatingNav />
    </AquaticBackground>
  );
};

export default BlogPostPage;