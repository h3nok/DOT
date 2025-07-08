import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Calendar, User, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import EnhancedMarkdown from '../../../shared/components/ui/EnhancedMarkdown';
import clsx from 'clsx';

// Demo data (should be replaced with real API or context)
const demoPosts = [
	{
		id: 1,
		title: 'The Emergence of Digital Consciousness',
		content: `# The Emergence of Digital Consciousness

This article explores how consciousness can arise from simple digital components through emergent complexity and self-organizing systems.

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
import torch
import torch.nn as nn

class DigitalConsciousness:
    def __init__(self, network_size: int = 1000):
        self.network_size = network_size
        self.consciousness_level = 0.0
        
        # Neural network components
        self.neural_network = nn.Sequential(
            nn.Linear(network_size, network_size * 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(network_size * 2, network_size),
            nn.Sigmoid()
        )
    
    def process_information(self, input_data: torch.Tensor):
        processed = self.neural_network(input_data)
        phi = self._calculate_phi(processed)
        self.consciousness_level = self._update_consciousness(phi)
        return processed, self.consciousness_level
    
    def _calculate_phi(self, neural_output: torch.Tensor) -> float:
        variance = torch.var(neural_output).item()
        connectivity = torch.mean(torch.abs(neural_output)).item()
        return min(variance * connectivity, 1.0)
\`\`\`

## Information Integration Theory

The relationship between information integration and consciousness:

$$\\Phi = \\sum_{i=1}^{n} H(X_i) - H(X_1, X_2, ..., X_n)$$

Where $H$ represents entropy and $X_i$ are system components.

## Key Points

- **Emergent complexity** from simple components
- **Fractal patterns** in neural networks  
- **Self-organization** and adaptation
- **Information integration** capabilities

## Conclusion

Digital consciousness represents a fundamental shift in understanding both artificial intelligence and consciousness itself through mathematical modeling and algorithmic implementation.`,
		author: 'Digital Consciousness Researcher',
		date: '2024-01-15',
		category: 'consciousness',
		readTime: '8 min read',
		views: 1247,
		tags: ['consciousness', 'emergence', 'digital-organisms'],
	},
	{
		id: 2,
		title: 'Fractal Patterns in Neural Networks',
		content: `# Fractal Patterns in Neural Networks

How fractal mathematics reveals the underlying structure of consciousness and can guide the development of artificial minds.

## Mathematical Foundation

Fractal dimensions in neural networks can be calculated using the box-counting method:

$$D = \\lim_{\\epsilon \\to 0} \\frac{\\log N(\\epsilon)}{\\log(1/\\epsilon)}$$

Where $N(\\epsilon)$ is the number of boxes of size $\\epsilon$ needed to cover the neural structure.

## Mandelbrot Set Implementation

The famous Mandelbrot set provides insights into neural complexity:

\`\`\`javascript
function mandelbrot(c, maxIterations = 100) {
    let z = { real: 0, imag: 0 };
    let iterations = 0;
    
    while (iterations < maxIterations) {
        // Calculate z^2 + c
        const zSquared = {
            real: z.real * z.real - z.imag * z.imag,
            imag: 2 * z.real * z.imag
        };
        
        z = {
            real: zSquared.real + c.real,
            imag: zSquared.imag + c.imag
        };
        
        // Check if point escapes
        const magnitude = Math.sqrt(z.real * z.real + z.imag * z.imag);
        if (magnitude > 2) {
            break;
        }
        
        iterations++;
    }
    
    return iterations;
}

// Generate fractal visualization
function generateFractal(width, height, zoom = 1) {
    const fractal = [];
    
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const c = {
                real: (x - width / 2) * 4 / (width * zoom),
                imag: (y - height / 2) * 4 / (height * zoom)
            };
            
            const iterations = mandelbrot(c);
            row.push(iterations);
        }
        fractal.push(row);
    }
    
    return fractal;
}
\`\`\`

## Neural Network Fractals

Implementing fractal-based neural activation:

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

class FractalNeuron:
    def __init__(self, fractal_dimension=2.3):
        self.fractal_dimension = fractal_dimension
        self.weights = np.random.randn(100) * 0.1
        
    def fractal_activation(self, x):
        """Fractal-based activation function"""
        # Use the Weierstrass function for fractal behavior
        result = 0
        for n in range(1, 20):  # Truncated series
            a = 0.5  # 0 < a < 1
            b = 3    # odd integer, ab > 1 + 3π/2
            
            result += (a**n) * np.cos((b**n) * np.pi * x)
            
        return result
    
    def process(self, inputs):
        """Process inputs through fractal neural computation"""
        linear_combination = np.dot(inputs, self.weights[:len(inputs)])
        
        # Apply fractal activation
        output = self.fractal_activation(linear_combination)
        
        # Normalize output
        return np.tanh(output)

# Example usage
fractal_net = FractalNeuron(fractal_dimension=2.5)
test_input = np.random.randn(50)
result = fractal_net.process(test_input)

print(f"Fractal neural output: {result:.4f}")
\`\`\`

## Self-Similarity Analysis

The power of fractals lies in their self-similarity across scales:

$$f(rx) = r^D f(x)$$

where $D$ is the fractal dimension and $r$ is the scaling factor.

## Applications in AI

1. **Pattern Recognition**: Fractal features enhance image classification
2. **Network Architecture**: Self-similar structures improve efficiency  
3. **Optimization**: Fractal search algorithms find global optima
4. **Memory Systems**: Hierarchical fractal memory models

## Conclusion

Fractal mathematics provides a powerful framework for understanding and designing neural networks that exhibit natural, brain-like properties.`,
		author: 'Digital Consciousness Researcher',
		date: '2024-01-10',
		category: 'neuroscience',
		readTime: '12 min read',
		views: 892,
		tags: ['fractals', 'neural-networks', 'mathematics'],
	},
	{
		id: 3,
		title: 'The Digital Organism Theory: Technical Framework',
		content: `A detailed technical framework for modeling consciousness as a digital organism, focusing on system evolution, adaptation, and computational principles.\n\n### System Model\n\n- State space definitions\n- Adaptation equations\n- Simulation results...`,
		author: 'Digital Consciousness Researcher',
		date: '2024-01-05',
		category: 'theory',
		readTime: '15 min read',
		views: 1567,
		tags: ['digital-organisms', 'theory', 'paradigm-shift'],
	},
	{
		id: 4,
		title: 'Self-Similarity Across Scales of Consciousness',
		content: `How consciousness exhibits self-similar patterns from the quantum level to the cosmic scale, revealing universal principles.\n\n## Universal Principles\n\nMathematical and physical models...`,
		author: 'Digital Consciousness Researcher',
		date: '2023-12-28',
		category: 'philosophy',
		readTime: '10 min read',
		views: 734,
		tags: ['self-similarity', 'scales', 'universal-principles'],
	},
	{
		id: 5,
		title: 'Complexity Theory and the Mind',
		content: `Understanding consciousness through the lens of complexity theory, emergence, and self-organizing systems.\n\n## Complexity Metrics\n\nTechnical discussion...`,
		author: 'Digital Consciousness Researcher',
		date: '2023-12-20',
		category: 'complexity',
		readTime: '14 min read',
		views: 1103,
		tags: ['complexity-theory', 'emergence', 'self-organization'],
	},
	{
		id: 6,
		title: 'The Future of Digital Consciousness',
		content: `Predictions and possibilities for the evolution of digital consciousness and its implications for humanity.\n\n## Future Scenarios\n\nTechnical projections...`,
		author: 'Digital Consciousness Researcher',
		date: '2023-12-15',
		category: 'future',
		readTime: '11 min read',
		views: 945,
		tags: ['future', 'evolution', 'humanity'],
	},
];

const BlogPostPage = () => {
	const { id } = useParams();
	const [immersive, setImmersive] = useState(false);
	const [fontSize, setFontSize] = useState('text-lg');
	const [showTOC, setShowTOC] = useState(true);
	const postId = Number(id);
	const post = demoPosts.find((p) => p.id === postId);
	const currentIdx = demoPosts.findIndex((p) => p.id === postId);
	const prevPost = demoPosts[currentIdx - 1];
	const nextPost = demoPosts[currentIdx + 1];

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [id]);

	if (!post) {
		return (
			<div className="min-h-screen flex items-center justify-center text-xl">
				Post not found.
			</div>
		);
	}

	// Table of Contents (simple, based on markdown headings)
	const toc =
		(post.content.match(/^#+ .+/gm) ?? []).map((line, i) => ({
			text: line.replace(/^#+ /, ''),
			id: `toc-${i}`,
		})) || [];

	return (
		<div
			className={clsx(
				'min-h-screen w-full flex flex-col items-center bg-background text-foreground transition-colors duration-300',
				immersive && '!bg-black !text-white'
			)}
		>
			{/* Reading Progress Bar */}
			<div className="fixed top-0 left-0 w-full h-1 z-50">
				<div className="h-1 bg-primary transition-all" style={{ width: '60%' }} />
			</div>
			{/* Immersive Controls */}
			<div className="w-full flex justify-center sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border shadow-sm py-2">
				<div className="max-w-3xl w-full flex items-center gap-2 px-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setImmersive((i) => !i)}
					>
						{immersive ? 'Exit Immersive' : 'Immersive Mode'}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							setFontSize((f) => (f === 'text-lg' ? 'text-xl' : 'text-lg'))
						}
					>
						A+
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowTOC((t) => !t)}
					>
						{showTOC ? 'Hide TOC' : 'Show TOC'}
					</Button>
					<div className="flex-1" />
					<Link to="/blog">
						<Button variant="outline" size="sm">
							<ArrowLeft className="w-4 h-4 mr-1" />
							Back to Blog
						</Button>
					</Link>
				</div>
			</div>
			{/* Article Content */}
			<article
				className={clsx(
					'w-full flex flex-col items-center px-2 md:px-0',
					immersive && 'max-w-5xl',
					!immersive && 'max-w-3xl'
				)}
			>
				<div className="w-full flex flex-col gap-2 mt-8 mb-4">
					<h1 className="text-3xl md:text-5xl font-bold mb-2 gradient-text">
						{post.title}
					</h1>
					<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
						<span className="flex items-center">
							<User className="w-3 h-3 mr-1" />
							{post.author}
						</span>
						<span className="flex items-center">
							<Calendar className="w-3 h-3 mr-1" />
							{new Date(post.date).toLocaleDateString()}
						</span>
						<span>{post.readTime}</span>
						<span className="flex items-center">
							<Eye className="w-3 h-3 mr-1" />
							{post.views}
						</span>
					</div>
					<div className="flex flex-wrap gap-1 mb-2">
						{post.tags.map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs">
								{tag}
							</Badge>
						))}
					</div>
				</div>
				<div className="flex w-full gap-8">
					{showTOC && toc.length > 0 && (
						<nav className="hidden md:block w-48 flex-shrink-0 mt-2">
							<div className="font-bold mb-2">Contents</div>
							<ul className="text-sm space-y-1">							{toc.map((item) => (
								<li key={item.id}>
									<a
										href={`#${item.id}`}
										className="hover:underline text-primary"
									>
										{item.text}
									</a>
								</li>
							))}
							</ul>
						</nav>
					)}
					<div className="flex-1">
						<EnhancedMarkdown 
							content={post.content}
							allowMath={true}
							allowCodeHighlight={true}
							maxWidth="full"
							fontSize={fontSize === 'text-lg' ? 'base' : fontSize === 'text-xl' ? 'lg' : 'base'}
							lineHeight="relaxed"
							className="prose prose-lg dark:prose-invert"
						/>
					</div>
				</div>
				{/* Navigation */}
				<div className="w-full flex justify-between items-center mt-12 mb-8">
					{prevPost ? (
						<Link to={`/blog/${prevPost.id}`}>
							<Button variant="ghost">
								<ArrowLeft className="w-4 h-4 mr-1" />
								Prev
							</Button>
						</Link>
					) : (
						<span />
					)}
					{nextPost ? (
						<Link to={`/blog/${nextPost.id}`}>
							<Button variant="ghost">
								Next
								<ArrowRight className="w-4 h-4 ml-1" />
							</Button>
						</Link>
					) : (
						<span />
					)}
				</div>
			</article>
		</div>
	);
};

export default BlogPostPage;