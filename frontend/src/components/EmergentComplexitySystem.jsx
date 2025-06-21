import React, { useEffect, useRef, useState } from 'react';

class Particle {
  constructor(x, y, stage = 'seed') {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5; // Random velocity
    this.vy = (Math.random() - 0.5) * 0.5;
    this.stage = stage;
    this.neighbors = [];
    this.trail = [];
    this.maxTrailLength = 10;
    this.neighborhoodRadius = 50;
    this.alignmentStrength = 0.05;
    this.cohesionStrength = 0.02;
    this.separationStrength = 0.1;
    this.fieldStrength = 0.05;
    this.trailStrength = 0.03;
  }

  update(particles, width, height, time) {
    // Update trail
    this.trail.push({ x: this.x, y: this.y, time });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Find neighbors
    this.neighbors = particles.filter(p => {
      if (p === this) return false;
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < this.neighborhoodRadius;
    });

    // Apply different behaviors based on stage
    switch (this.stage) {
      case 'seed':
        // Just random motion
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
        break;
      
      case 'motion':
        // Simple motion with slight alignment
        if (this.neighbors.length > 0) {
          const avgVx = this.neighbors.reduce((sum, n) => sum + n.vx, 0) / this.neighbors.length;
          const avgVy = this.neighbors.reduce((sum, n) => sum + n.vy, 0) / this.neighbors.length;
          this.vx += (avgVx - this.vx) * this.alignmentStrength * 0.5;
          this.vy += (avgVy - this.vy) * this.alignmentStrength * 0.5;
        }
        break;
      
      case 'rules':
        // Full flocking rules
        this.applyAlignment();
        this.applyCohesion();
        this.applySeparation();
        this.applyFlowField(time);
        break;
      
      case 'feedback':
        // Rules + trail following
        this.applyAlignment();
        this.applyCohesion();
        this.applySeparation();
        this.applyFlowField(time);
        this.applyTrailAttraction(particles);
        break;
      
      case 'emergent':
        // Full emergent behavior
        this.applyAlignment();
        this.applyCohesion();
        this.applySeparation();
        this.applyFlowField(time);
        this.applyTrailAttraction(particles);
        this.applyEmergentBehavior(time);
        break;
    }

    // Limit velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const maxSpeed = 2;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around edges
    this.x = (this.x + width) % width;
    this.y = (this.y + height) % height;

    // Evolve stage based on conditions
    this.evolveStage(particles);
  }

  applyAlignment() {
    if (this.neighbors.length === 0) return;
    
    const avgVx = this.neighbors.reduce((sum, n) => sum + n.vx, 0) / this.neighbors.length;
    const avgVy = this.neighbors.reduce((sum, n) => sum + n.vy, 0) / this.neighbors.length;
    
    this.vx += (avgVx - this.vx) * this.alignmentStrength;
    this.vy += (avgVy - this.vy) * this.alignmentStrength;
  }

  applyCohesion() {
    if (this.neighbors.length === 0) return;
    
    const centerX = this.neighbors.reduce((sum, n) => sum + n.x, 0) / this.neighbors.length;
    const centerY = this.neighbors.reduce((sum, n) => sum + n.y, 0) / this.neighbors.length;
    
    this.vx += (centerX - this.x) * this.cohesionStrength;
    this.vy += (centerY - this.y) * this.cohesionStrength;
  }

  applySeparation() {
    this.neighbors.forEach(neighbor => {
      const dx = this.x - neighbor.x;
      const dy = this.y - neighbor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20 && distance > 0) {
        const force = this.separationStrength / (distance * distance);
        this.vx += (dx / distance) * force;
        this.vy += (dy / distance) * force;
      }
    });
  }

  applyFlowField(time) {
    // Simulate Perlin noise flow field
    const noiseX = this.x * 0.002;
    const noiseY = this.y * 0.002;
    const noiseTime = time * 0.003;
    
    // Simple noise approximation
    const angle = (Math.sin(noiseX) + Math.cos(noiseY) + Math.sin(noiseTime)) * Math.PI * 2;
    
    this.vx += Math.cos(angle) * this.fieldStrength;
    this.vy += Math.sin(angle) * this.fieldStrength;
  }

  applyTrailAttraction(particles) {
    // Attract to recent trail positions of other particles
    particles.forEach(particle => {
      if (particle === this) return;
      
      particle.trail.forEach(trailPoint => {
        const dx = trailPoint.x - this.x;
        const dy = trailPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30 && distance > 0) {
          const force = this.trailStrength / distance;
          this.vx += (dx / distance) * force;
          this.vy += (dy / distance) * force;
        }
      });
    });
  }

  applyEmergentBehavior(time) {
    // Additional emergent behaviors
    const globalAngle = time * 0.001;
    const radius = Math.sqrt(this.x * this.x + this.y * this.y);
    
    // Spiral behavior
    if (radius > 100) {
      const spiralForce = 0.02;
      this.vx += Math.cos(globalAngle) * spiralForce;
      this.vy += Math.sin(globalAngle) * spiralForce;
    }
    
    // Oscillatory behavior
    const oscillation = Math.sin(time * 0.01 + this.x * 0.01) * 0.01;
    this.vx += oscillation;
    this.vy += oscillation;
  }

  evolveStage(particles) {
    // Evolve based on neighborhood density and behavior
    const neighborCount = this.neighbors.length;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    
    if (this.stage === 'seed' && neighborCount > 3) {
      this.stage = 'motion';
    } else if (this.stage === 'motion' && neighborCount > 5 && speed > 0.5) {
      this.stage = 'rules';
    } else if (this.stage === 'rules' && neighborCount > 7) {
      this.stage = 'feedback';
    } else if (this.stage === 'feedback' && neighborCount > 10) {
      this.stage = 'emergent';
    }
  }

  draw(ctx) {
    // Draw trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(165, 101, 255, ${0.3 * (this.trail.length / this.maxTrailLength)})`;
      ctx.lineWidth = 1;
      
      this.trail.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    }

    // Draw particle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.getRadius(), 0, Math.PI * 2);
    
    const stageColors = {
      seed: 'rgba(255, 255, 255, 0.6)',
      motion: 'rgba(200, 180, 255, 0.8)',
      rules: 'rgba(165, 101, 255, 1)',
      feedback: 'rgba(130, 80, 255, 1)',
      emergent: 'rgba(100, 60, 255, 1)'
    };
    
    ctx.fillStyle = stageColors[this.stage];
    ctx.fill();
    
    // Add glow for advanced stages
    if (this.stage === 'feedback' || this.stage === 'emergent') {
      ctx.shadowColor = stageColors[this.stage];
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  getRadius() {
    const stageSizes = {
      seed: 2,
      motion: 3,
      rules: 4,
      feedback: 5,
      emergent: 6
    };
    return stageSizes[this.stage];
  }
}

const EmergentComplexitySystem = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const timeRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = 300;
      
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push(new Particle(x, y, 'seed'));
      }
    };

    // Animation loop
    const animate = () => {
      timeRef.current += 1;
      
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update(particlesRef.current, canvas.width, canvas.height, timeRef.current);
        particle.draw(ctx);
      });
      
      // Draw emergent structures
      drawEmergentStructures(ctx, canvas.width, canvas.height, timeRef.current);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawEmergentStructures = (ctx, width, height, time) => {
      // Draw swirls where particles are densely clustered
      const clusters = findClusters(particlesRef.current, 100);
      
      clusters.forEach(cluster => {
        const centerX = cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length;
        const centerY = cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;
        const radius = cluster.length * 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(165, 101, 255, ${0.3 * (cluster.length / 20)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    const findClusters = (particles, radius) => {
      const clusters = [];
      const visited = new Set();
      
      particles.forEach(particle => {
        if (visited.has(particle)) return;
        
        const cluster = [];
        const queue = [particle];
        
        while (queue.length > 0) {
          const current = queue.shift();
          if (visited.has(current)) continue;
          
          visited.add(current);
          cluster.push(current);
          
          particles.forEach(other => {
            if (!visited.has(other)) {
              const dx = other.x - current.x;
              const dy = other.y - current.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < radius) {
                queue.push(other);
              }
            }
          });
        }
        
        if (cluster.length > 5) {
          clusters.push(cluster);
        }
      });
      
      return clusters;
    };

    // Start animation when component is visible
    if (isVisible) {
      initParticles();
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible]);

  // Intersection Observer to start animation when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => {
      if (canvasRef.current) {
        observer.unobserve(canvasRef.current);
      }
    };
  }, []);

  return (
    <div className="consciousness-particle-system">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default EmergentComplexitySystem; 