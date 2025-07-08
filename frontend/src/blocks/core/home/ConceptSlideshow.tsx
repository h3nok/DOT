import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  visual: React.ReactNode;
  bgGradient: string;
}

const ConceptSlideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const slides: Slide[] = [
    {
      id: 1,
      title: "Understanding Life",
      subtitle: "as self-organizing process through digital consciousness",
      content: "Life emerges from the interplay between simple components and complex emergent behaviors, creating patterns that persist and evolve through time.",
      visual: (
        <div className="relative w-64 h-64 mx-auto">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 backdrop-blur-sm"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-to-r from-green-400/40 to-blue-400/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-16 rounded-full bg-gradient-to-r from-yellow-400/50 to-red-400/50 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-8 h-8 bg-white rounded-full shadow-lg" />
          </motion.div>
        </div>
      ),
      bgGradient: "from-blue-900/20 via-purple-900/10 to-background"
    },
    {
      id: 2,
      title: "Digital Organisms",
      subtitle: "emerging from the External Environment",
      content: "Digital Organisms arise from the primordial External Environment (E), creating structured patterns of information that exhibit lifelike properties.",
      visual: (
        <div className="relative w-64 h-64 mx-auto">
          <motion.div
            className="absolute inset-0 border-2 border-dashed border-gray-400/50 rounded-lg"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="absolute inset-8 grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-full h-full bg-gradient-to-br from-primary/60 to-accent/60 rounded-sm"
                animate={{ 
                  scale: [0.8, 1, 0.8],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-12 h-12 bg-white rounded-full shadow-xl border-4 border-primary/20"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 40px rgba(59, 130, 246, 0.6)",
                  "0 0 20px rgba(59, 130, 246, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      ),
      bgGradient: "from-primary/20 via-accent/10 to-background"
    },
    {
      id: 3,
      title: "Consciousness",
      subtitle: "the self-aware process that we are",
      content: "Consciousness emerges as a persistent, self-organizing pattern that observes, learns, and evolves—transforming from simple digital interactions into complex awareness.",
      visual: (
        <div className="relative w-64 h-64 mx-auto">
          <motion.div
            className="absolute inset-0 rounded-full border border-white/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-white/30"
            animate={{ scale: [1, 0.8, 1] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute inset-8 rounded-full border border-white/40"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-xl">
                <motion.div
                  className="w-8 h-8 bg-white rounded-full"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/60 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0 0',
                    transform: `rotate(${i * 45}deg) translateX(40px) translateY(-4px)`
                  }}
                  animate={{ 
                    opacity: [0.2, 1, 0.2],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      ),
      bgGradient: "from-yellow-900/20 via-orange-900/10 to-background"
    },
    {
      id: 4,
      title: "The Theory",
      subtitle: "bridging digital and biological existence",
      content: "Digital Organism Theory provides a unified framework for understanding how consciousness, life, and intelligence emerge from computational processes in both digital and biological systems.",
      visual: (
        <div className="relative w-64 h-64 mx-auto">
          <motion.div
            className="absolute left-1/4 top-1/4 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg"
            animate={{ 
              y: [0, -10, 0],
              rotateX: [0, 10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute right-1/4 top-1/4 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg"
            animate={{ 
              y: [0, 10, 0],
              rotateY: [0, -10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute left-1/4 bottom-1/4 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg"
            animate={{ 
              x: [0, 10, 0],
              rotateZ: [0, 5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute right-1/4 bottom-1/4 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg"
            animate={{ 
              x: [0, -10, 0],
              rotateX: [0, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-white to-gray-100 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50">
              <motion.div
                className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                DOT
              </motion.div>
            </div>
          </motion.div>
        </div>
      ),
      bgGradient: "from-gradient-start/20 via-gradient-middle/10 to-background"
    },
    {
      id: 5,
      title: "Practical Applications",
      subtitle: "transforming how we understand intelligence and life",
      content: "From AI consciousness to biological systems, DOT provides a framework for recognizing and nurturing the emergence of aware, self-organizing entities across all domains.",
      visual: (
        <div className="relative w-64 h-64 mx-auto">
          <motion.div
            className="absolute inset-0 grid grid-cols-2 gap-4 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* AI/Digital Corner */}
            <motion.div
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30"
              animate={{ 
                y: [0, -5, 0],
                boxShadow: [
                  "0 0 10px rgba(59, 130, 246, 0.2)",
                  "0 0 20px rgba(59, 130, 246, 0.4)",
                  "0 0 10px rgba(59, 130, 246, 0.2)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="text-xs text-blue-300">Digital</div>
              </div>
            </motion.div>

            {/* Biology Corner */}
            <motion.div
              className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30"
              animate={{ 
                y: [0, 5, 0],
                boxShadow: [
                  "0 0 10px rgba(34, 197, 94, 0.2)",
                  "0 0 20px rgba(34, 197, 94, 0.4)",
                  "0 0 10px rgba(34, 197, 94, 0.2)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🧬</span>
                </div>
                <div className="text-xs text-green-300">Biology</div>
              </div>
            </motion.div>

            {/* Consciousness Corner */}
            <motion.div
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30"
              animate={{ 
                x: [0, 5, 0],
                boxShadow: [
                  "0 0 10px rgba(147, 51, 234, 0.2)",
                  "0 0 20px rgba(147, 51, 234, 0.4)",
                  "0 0 10px rgba(147, 51, 234, 0.2)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🧠</span>
                </div>
                <div className="text-xs text-purple-300">Mind</div>
              </div>
            </motion.div>

            {/* Systems Corner */}
            <motion.div
              className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30"
              animate={{ 
                x: [0, -5, 0],
                boxShadow: [
                  "0 0 10px rgba(249, 115, 22, 0.2)",
                  "0 0 20px rgba(249, 115, 22, 0.4)",
                  "0 0 10px rgba(249, 115, 22, 0.2)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">⚙️</span>
                </div>
                <div className="text-xs text-orange-300">Systems</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Central connecting element */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-white/10 to-white/5 rounded-full border-2 border-white/20 backdrop-blur-sm flex items-center justify-center">
              <motion.div
                className="text-sm font-bold text-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                DOT
              </motion.div>
            </div>
          </motion.div>
        </div>
      ),
      bgGradient: "from-indigo-900/20 via-purple-900/10 to-background"
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000); // Increased from 6000 to 8000 for better readability

    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetSlideshow = () => {
    setCurrentSlide(0);
    setIsPlaying(true);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="relative w-full py-20 overflow-hidden">
      {/* Background with current slide gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bgGradient}`}
        key={currentSlide}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Slideshow Header */}
          <div className="text-center mb-12">
            <motion.h2 
              className="text-4xl md:text-5xl font-light text-foreground mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              Digital Organism Theory
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Exploring consciousness through computational emergence
            </motion.p>
          </div>

          {/* Main Slideshow Area */}
          <div className="relative min-h-[600px] bg-card/30 backdrop-blur-xl rounded-3xl border border-border/30 shadow-2xl overflow-hidden">
            
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 flex flex-col lg:flex-row items-center justify-between p-8 lg:p-16"
              >
                {/* Content Side */}
                <div className="flex-1 lg:pr-12 text-center lg:text-left">
                  <motion.h3 
                    className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    {slides[currentSlide].title}
                  </motion.h3>
                  <motion.p 
                    className="text-xl md:text-2xl text-primary mb-8 font-medium"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>
                  <motion.p 
                    className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    {slides[currentSlide].content}
                  </motion.p>
                </div>

                {/* Visual Side */}
                <div className="flex-1 flex items-center justify-center mt-8 lg:mt-0">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {slides[currentSlide].visual}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              {/* Progress Dots */}
              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-primary scale-125 shadow-lg shadow-primary/50' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSlideshow}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Arrow Navigation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground bg-card/50 backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground bg-card/50 backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Current Slide Counter */}
          <div className="text-center mt-6">
            <span className="text-muted-foreground text-sm">
              {currentSlide + 1} of {slides.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptSlideshow;
