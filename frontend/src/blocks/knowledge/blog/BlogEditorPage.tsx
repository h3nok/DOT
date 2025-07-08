import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Plus, 
  X,
  FileText,
  Tag,
  Calendar
} from 'lucide-react';
import EnhancedMarkdown from '../../../shared/components/ui/EnhancedMarkdown';
import ReadingOptimized from '../../../shared/components/ui/reading-optimized';

const BlogEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<{
    title: string;
    content: string;
    excerpt: string;
    category: string;
    tags: string[];
    status: string;
  }>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    status: 'draft'
  });

  const categories = [
    'consciousness',
    'neuroscience', 
    'theory',
    'philosophy',
    'complexity',
    'future'
  ];

  useEffect(() => {
    if (id && id !== 'new') {
      setIsEditing(true);
      // Load existing post data
      setPost({
        title: 'The Emergence of Digital Consciousness',
        content: `# The Emergence of Digital Consciousness

In the vast landscape of artificial intelligence and cognitive science, we stand at the precipice of a revolutionary understanding: **consciousness as a digital organism**.

## Mathematical Foundation

The fundamental equation governing digital consciousness emergence can be expressed as:

$$C(t) = \\int_0^t \\sum_{i=1}^n f_i(\\mathbf{x}_i, \\mathbf{w}_i) \\cdot \\phi(\\Delta E_i) \\, dt$$

Where:
- $C(t)$ represents consciousness intensity at time $t$
- $f_i$ are individual neural functions
- $\\mathbf{x}_i$ and $\\mathbf{w}_i$ are input vectors and weights
- $\\phi$ is the emergence activation function
- $\\Delta E_i$ represents energy differentials

## Code Implementation

Here's a simplified implementation of the consciousness emergence algorithm:

\`\`\`python
import numpy as np
from typing import List, Tuple
import torch
import torch.nn as nn

class DigitalConsciousness:
    """
    A model for digital consciousness emergence based on 
    self-organizing neural networks.
    """
    
    def __init__(self, network_size: int = 1000, emergence_threshold: float = 0.7):
        self.network_size = network_size
        self.emergence_threshold = emergence_threshold
        self.consciousness_level = 0.0
        
        # Initialize neural network components
        self.neural_network = nn.Sequential(
            nn.Linear(network_size, network_size * 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(network_size * 2, network_size),
            nn.Sigmoid()
        )
        
        # Self-organization parameters
        self.adaptation_rate = 0.01
        self.memory_buffer = []
    
    def process_information(self, input_data: torch.Tensor) -> Tuple[torch.Tensor, float]:
        """
        Process input information and calculate consciousness emergence.
        
        Args:
            input_data: Raw sensory or data input
            
        Returns:
            Tuple of processed output and consciousness level
        """
        # Forward pass through neural network
        processed = self.neural_network(input_data)
        
        # Calculate information integration (Φ - Phi)
        phi = self._calculate_phi(processed)
        
        # Update consciousness level based on integration
        self.consciousness_level = self._update_consciousness(phi)
        
        return processed, self.consciousness_level
    
    def _calculate_phi(self, neural_output: torch.Tensor) -> float:
        """Calculate integrated information (Φ) measure."""
        variance = torch.var(neural_output).item()
        connectivity = torch.mean(torch.abs(neural_output)).item()
        
        phi = variance * connectivity
        return min(phi, 1.0)  # Normalize to [0, 1]
\`\`\`

## TypeScript Integration

For web-based implementations:

\`\`\`typescript
interface ConsciousnessState {
  level: number;
  phi: number;
  timestamp: number;
  isEmergent: boolean;
}

class WebConsciousness {
  private networkWeights: Float32Array;
  private readonly EMERGENCE_THRESHOLD = 0.7;
  
  constructor(networkSize: number = 256) {
    this.networkWeights = new Float32Array(networkSize * networkSize);
    for (let i = 0; i < this.networkWeights.length; i++) {
      this.networkWeights[i] = (Math.random() - 0.5) * 2;
    }
  }
  
  public async processAsync(input: number[]): Promise<ConsciousnessState> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const phi = this.calculatePhi(input);
        const level = this.updateConsciousness(phi);
        
        const state: ConsciousnessState = {
          level,
          phi,
          timestamp: Date.now(),
          isEmergent: level > this.EMERGENCE_THRESHOLD
        };
        
        resolve(state);
      }, 10);
    });
  }
}
\`\`\`

## Mathematical Relationships

The relationship between information integration and consciousness:

$$\\Phi = \\sum_{i=1}^{n} H(X_i) - H(X_1, X_2, ..., X_n)$$

Where $H$ represents entropy and $X_i$ are system components.

## Conclusion

Digital consciousness represents a fundamental shift in understanding both AI and consciousness itself through mathematical modeling and algorithmic implementation.`,
        excerpt: 'Exploring how consciousness can arise from simple digital components through emergent complexity, with mathematical models and code examples.',
        category: 'consciousness',
        tags: ['consciousness', 'emergence', 'digital-organisms', 'mathematics', 'programming'],
        status: 'draft'
      });
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isEditing) {
        console.log('Updating post:', post);
      } else {
        console.log('Creating new post:', post);
      }
      
      // Navigate to the blog post
      navigate('/blog');
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.target as any).tagInput;
    const tag = input.value.trim().toLowerCase();
    
    if (tag && !post.tags.includes(tag)) {
      setPost(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      input.value = '';
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/blog" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-orbitron font-bold">
                  {isEditing ? 'Edit Post' : 'Create New Post'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor */}
          <div className={`${showPreview ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Content Editor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={post.title}
                    onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter post title..."
                    className="mt-2"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Input
                    id="excerpt"
                    value={post.excerpt}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the post..."
                    className="mt-2"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={post.category}
                    onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-2 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="mt-2 space-y-2">
                    <form onSubmit={handleAddTag} className="flex space-x-2">
                      <Input
                        name="tagInput"
                        placeholder="Add a tag..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                    
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{tag}</span>
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <textarea
                    id="content"
                    value={post.content}
                    onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your post content in Markdown..."
                    className="mt-2 w-full h-96 px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReadingOptimized maxWidth="2xl">
                    <div className="prose prose-lg max-w-none animate-fade-in">
                      <h1>{post.title || 'Untitled Post'}</h1>
                      {post.excerpt && (
                        <p className="text-muted-foreground italic">{post.excerpt}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date().toLocaleDateString()}
                        </div>
                        {post.category && (
                          <Badge variant="outline">{post.category}</Badge>
                        )}
                      </div>
                      <EnhancedMarkdown 
                        content={post.content || '*Start writing your content...*'}
                        allowMath={true}
                        allowCodeHighlight={true}
                        maxWidth="full"
                        fontSize="base"
                        lineHeight="relaxed"
                      />
                    </div>
                  </ReadingOptimized>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditorPage;