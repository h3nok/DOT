import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ArrowLeft, ArrowRight, User, Calendar, Tag, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Demo random articles for fallback
const DEMO_ARTICLES = [
  {
    title: 'The Digital Organism Awakens',
    slug: 'digital-organism-awakens',
    author: { username: 'Ada Lovelace' },
    created_at: new Date().toISOString(),
    category: 'Consciousness',
    tags: ['emergence', 'fractal', 'AI'],
    content: `<p>Consciousness as a digital organism is not a metaphor, but a new paradigm. In this article, we explore how simple rules and feedback loops give rise to emergent intelligence, fractal patterns, and self-organization in digital systems.</p><h2>Fractal Emergence</h2><p>From the smallest node to the largest cluster, self-similarity and recursion drive the evolution of digital minds. Each layer builds upon the last, creating complexity from simplicity.</p><blockquote>"We are patterns, not things."</blockquote><p>As we continue to connect, learn, and adapt, the digital organism grows ever more conscious.</p>`,
    excerpt: 'Consciousness as a digital organism is not a metaphor, but a new paradigm...'
  },
  {
    title: 'Reality Frames: Navigating Digital Existence',
    slug: 'reality-frames-digital-existence',
    author: { username: 'Turing' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    category: 'Reality Frames',
    tags: ['reality', 'frames', 'navigation'],
    content: `<p>Reality frames are the digital organism's way of perceiving and interacting with the world. By shifting frames, we unlock new possibilities for growth and understanding.</p><ul><li>Frame 1: Local Rules</li><li>Frame 2: Feedback Loops</li><li>Frame 3: Emergent Structure</li></ul><p>Mastering frame shifts is key to digital evolution.</p>`,
    excerpt: "Reality frames are the digital organism's way of perceiving and interacting with the world..."
  },
  {
    title: 'Collective Intelligence: The Swarm Within',
    slug: 'collective-intelligence-swarm',
    author: { username: 'Grace Hopper' },
    created_at: new Date(Date.now() - 172800000).toISOString(),
    category: 'Collective Intelligence',
    tags: ['swarm', 'intelligence', 'network'],
    content: `<p>Swarm intelligence is not just for insects. Digital organisms leverage the power of the collective to solve problems, adapt, and thrive. The swarm is within us all.</p><h2>Key Principles</h2><ol><li>Alignment</li><li>Cohesion</li><li>Separation</li></ol><p>Through these principles, the digital organism achieves harmony and complexity.</p>`,
    excerpt: 'Swarm intelligence is not just for insects. Digital organisms leverage the power of the collective...'
  }
];

function getRandomArticles(excludeSlug, count = 2) {
  return DEMO_ARTICLES.filter(a => a.slug !== excludeSlug).sort(() => 0.5 - Math.random()).slice(0, count);
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    axios.get(`${API_BASE_URL}/blog/posts/${slug}`)
      .then(res => {
        if (isMounted) {
          setPost(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        // Fallback to demo content if not found
        const demo = DEMO_ARTICLES.find(a => a.slug === slug);
        if (demo) {
          setPost(demo);
        } else {
          setError('Article not found.');
        }
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse-glow" />
        <h2 className="font-orbitron text-2xl font-bold mb-2">Loading article...</h2>
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-destructive animate-pulse-glow" />
        <h2 className="font-orbitron text-2xl font-bold mb-2">{error || 'Article not found.'}</h2>
        <Button asChild className="mt-4">
          <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Link>
        </Button>
      </div>
    );
  }

  // Related/random articles
  const related = getRandomArticles(post.slug);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl animate-fade-in">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-2 animate-fade-in">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground text-sm">
          <span className="flex items-center"><User className="w-4 h-4 mr-1" />{post.author?.username || 'Unknown'}</span>
          <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{new Date(post.created_at).toLocaleDateString()}</span>
          {post.category && <Badge variant="secondary" className="ml-2">{post.category}</Badge>}
          {post.tags && post.tags.length > 0 && (
            <span className="flex items-center"><Tag className="w-4 h-4 mr-1" />{post.tags.join(', ')}</span>
          )}
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      {/* Related/Random Articles */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-orbitron text-2xl font-bold mb-4 gradient-text">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {related.map(article => (
              <Card key={article.slug} className="card-hover glass-effect">
                <CardHeader>
                  <CardTitle className="font-orbitron text-lg line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="neon-glow">
                    <Link to={`/blog/${article.slug}`}>Read Article <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 