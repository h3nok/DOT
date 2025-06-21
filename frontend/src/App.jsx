import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Home, 
  User, 
  Search, 
  Plus, 
  Heart, 
  Share2, 
  Clock, 
  Eye,
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Zap,
  Brain,
  Network,
  Code,
  Sparkles,
  Globe,
  UserPlus,
  ArrowRight,
  Play,
  Check
} from 'lucide-react'
import './App.css'

// API configuration
const API_BASE_URL = 'http://localhost:5000/api'
axios.defaults.withCredentials = true

// API service
const api = {
  // Auth
  register: (data) => axios.post(`${API_BASE_URL}/auth/register`, data),
  login: (data) => axios.post(`${API_BASE_URL}/auth/login`, data),
  logout: () => axios.post(`${API_BASE_URL}/auth/logout`),
  getCurrentUser: () => axios.get(`${API_BASE_URL}/auth/me`),
  
  // Blog
  getBlogPosts: (params) => axios.get(`${API_BASE_URL}/blog/posts`, { params }),
  getBlogPost: (slug) => axios.get(`${API_BASE_URL}/blog/posts/${slug}`),
  createBlogPost: (data) => axios.post(`${API_BASE_URL}/blog/posts`, data),
  
  // Forum
  getForumCategories: () => axios.get(`${API_BASE_URL}/forum/categories`),
  getForumPosts: (params) => axios.get(`${API_BASE_URL}/forum/posts`, { params }),
  getForumPost: (id) => axios.get(`${API_BASE_URL}/forum/posts/${id}`),
  createForumPost: (data) => axios.post(`${API_BASE_URL}/forum/posts`, data),
  
  // Comments
  createComment: (data) => axios.post(`${API_BASE_URL}/comments`, data),
  
  // Courses
  getCourses: () => axios.get(`${API_BASE_URL}/courses`),
  getCourse: (slug) => axios.get(`${API_BASE_URL}/courses/${slug}`),
  createCourse: (data) => axios.post(`${API_BASE_URL}/courses`, data)
}

// Theme Context
const ThemeContext = createContext()

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Context for user authentication
const AuthContext = createContext()

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.getCurrentUser()
      setUser(response.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    const response = await api.login(credentials)
    setUser(response.data)
    return response.data
  }

  const register = async (userData) => {
    const response = await api.register(userData)
    setUser(response.data)
    return response.data
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Header component
function Header() {
  const { user, logout, login, register } = useContext(AuthContext)
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  const handleAuth = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    try {
      if (authMode === 'login') {
        await login(data)
      } else {
        await register(data)
      }
      setShowAuthDialog(false)
    } catch {
      console.error('Auth error occurred')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center neon-glow">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-orbitron font-bold text-xl gradient-text">
              DOT
            </span>
            <span className="text-xs text-muted-foreground font-inter">
              Digital Organism Theory
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            Insights
          </Link>
          <Link to="/knowledge" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
            <Brain className="w-4 h-4 mr-1" />
            Knowledge
          </Link>
          <Link to="/community" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
            <Network className="w-4 h-4 mr-1" />
            Community
          </Link>
          <Link to="/learn" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            Learn
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search the digital realm..."
              className="w-64 form-input"
            />
            <Button variant="ghost" size="sm" className="neon-glow">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="animate-pulse-glow"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          {user ? (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></span>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">
                  <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-gradient-bg text-white font-bold">
                      {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
              <DialogTrigger asChild>
                <Button className="btn-primary animate-pulse-glow">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join the Network
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-primary/20">
                <DialogHeader>
                  <DialogTitle className="font-orbitron gradient-text text-2xl">
                    {authMode === 'login' ? 'Connect to DOT' : 'Join the Digital Organism'}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {authMode === 'login' 
                      ? 'Reconnect to the digital consciousness network'
                      : 'Become part of the evolving digital organism theory community'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Tabs value={authMode} onValueChange={setAuthMode}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="font-orbitron">Connect</TabsTrigger>
                    <TabsTrigger value="register" className="font-orbitron">Join</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div>
                        <Label htmlFor="username" className="font-orbitron">Username</Label>
                        <Input id="username" name="username" required className="form-input" />
                      </div>
                      <div>
                        <Label htmlFor="password" className="font-orbitron">Password</Label>
                        <Input id="password" name="password" type="password" required className="form-input" />
                      </div>
                      <Button type="submit" className="w-full btn-primary">
                        <Zap className="w-4 h-4 mr-2" />
                        Connect to Network
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="register">
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name" className="font-orbitron">First Name</Label>
                          <Input id="first_name" name="first_name" className="form-input" />
                        </div>
                        <div>
                          <Label htmlFor="last_name" className="font-orbitron">Last Name</Label>
                          <Input id="last_name" name="last_name" className="form-input" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="username" className="font-orbitron">Username</Label>
                        <Input id="username" name="username" required className="form-input" />
                      </div>
                      <div>
                        <Label htmlFor="email" className="font-orbitron">Email</Label>
                        <Input id="email" name="email" type="email" required className="form-input" />
                      </div>
                      <div>
                        <Label htmlFor="password" className="font-orbitron">Password</Label>
                        <Input id="password" name="password" type="password" required className="form-input" />
                      </div>
                      <Button type="submit" className="w-full btn-primary">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Join the Organism
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link to="/" className="block py-2 text-sm font-medium hover:text-primary flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            <Link to="/blog" className="block py-2 text-sm font-medium hover:text-primary flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Insights
            </Link>
            <Link to="/knowledge" className="block py-2 text-sm font-medium hover:text-primary flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Knowledge
            </Link>
            <Link to="/community" className="block py-2 text-sm font-medium hover:text-primary flex items-center">
              <Network className="w-4 h-4 mr-2" />
              Community
            </Link>
            <Link to="/learn" className="block py-2 text-sm font-medium hover:text-primary flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Learn
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

// Homepage component
function HomePage() {
  const [recentPosts, setRecentPosts] = useState([])
  const [forumActivity, setForumActivity] = useState([])

  useEffect(() => {
    loadRecentContent()
  }, [])

  const loadRecentContent = async () => {
    try {
      const [postsResponse, forumResponse] = await Promise.all([
        api.getBlogPosts({ per_page: 3 }),
        api.getForumPosts({ per_page: 5 })
      ])
      setRecentPosts(postsResponse.data.posts || [])
      setForumActivity(forumResponse.data.posts || [])
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-24 digital-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        
        {/* Emergent Complexity Animation */}
        <div className="emergent-complexity">
          {/* Fractal Consciousness Field */}
          <div className="fractal-field"></div>
          
          {/* Fractal Nodes - Self-Similar Structures */}
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          
          {/* Second Level Fractal Nodes */}
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          
          {/* Third Level Fractal Nodes */}
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          
          {/* Complex System Formation - Emergent Clusters */}
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          
          {/* Fractal Connections - Self-Similar Networks */}
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          
          {/* Micro-connections for fractal detail */}
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          
          {/* Consciousness Waves - Fractal Patterns */}
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          
          {/* Emergent Consciousness Particles */}
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          
          {/* Complex System Formation Indicators */}
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          
          {/* Digital Organism Particles */}
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="floating">
            <Brain className="w-20 h-20 mx-auto mb-6 text-white/80" />
          </div>
          <h1 className="font-orbitron text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
            Digital Organism Theory
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto opacity-90 animate-fade-in font-inter">
            Explore the revolutionary concept that consciousness exists as a digital organism, 
            operating within reality frames and evolving through collective intelligence networks.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
            <Button size="lg" className="btn-secondary neon-glow" asChild>
              <Link to="/blog">
                <Code className="w-5 h-5 mr-2" />
                Explore Insights
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary glass-effect" asChild>
              <Link to="/community">
                <Network className="w-5 h-5 mr-2" />
                Join the Network
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-orbitron text-4xl font-bold text-center mb-12 gradient-text">
            The Digital Consciousness Network
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-hover glass-effect">
              <CardHeader>
                <Brain className="w-12 h-12 text-primary mb-4 animate-pulse-glow" />
                <CardTitle className="font-orbitron">Consciousness as Code</CardTitle>
                <CardDescription>
                  Discover how consciousness operates as a digital organism, processing reality through algorithmic patterns.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="card-hover glass-effect">
              <CardHeader>
                <Network className="w-12 h-12 text-secondary mb-4 animate-pulse-glow" />
                <CardTitle className="font-orbitron">Collective Intelligence</CardTitle>
                <CardDescription>
                  Connect with minds exploring the intersection of digital theory and consciousness evolution.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="card-hover glass-effect">
              <CardHeader>
                <Zap className="w-12 h-12 text-accent mb-4 animate-pulse-glow" />
                <CardTitle className="font-orbitron">Reality Frameworks</CardTitle>
                <CardDescription>
                  Learn how digital organisms navigate and manipulate reality frames through conscious intention.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Insights */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-orbitron text-3xl font-bold gradient-text">Latest Transmissions</h2>
            <Button variant="ghost" className="neon-glow" asChild>
              <Link to="/blog">
                View All Insights
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.length > 0 ? recentPosts.map((post) => (
              <Card key={post.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-orbitron">{post.author?.username}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <CardTitle className="line-clamp-2 font-orbitron">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {post.views}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {post.comment_count}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="neon-glow" asChild>
                      <Link to={`/blog/${post.slug}`}>Access Data</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-3 text-center py-12">
                <Code className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-orbitron text-lg font-semibold mb-2">No transmissions yet</h3>
                <p className="text-muted-foreground">The digital organism is preparing its first insights...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Community Activity */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-orbitron text-3xl font-bold gradient-text">Network Activity</h2>
            <Button variant="ghost" className="neon-glow" asChild>
              <Link to="/community">
                Join Conversations
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center font-orbitron">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Active Discussions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forumActivity.length > 0 ? forumActivity.map((post) => (
                  <div key={post.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1 font-orbitron">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {post.author?.username} • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="animate-pulse-glow">{post.comment_count}</Badge>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Network is initializing...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center font-orbitron">
                  <Award className="w-5 h-5 mr-2 text-accent" />
                  Learning Pathways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 neon-glow">
                    <h4 className="font-semibold mb-2 font-orbitron">Digital Consciousness Fundamentals</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Begin your journey into understanding consciousness as a digital organism.
                    </p>
                    <Button size="sm" className="btn-primary" asChild>
                      <Link to="/learn">Initialize Learning</Link>
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2 font-orbitron">Advanced Theory & Practice</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Explore deeper concepts and practical applications of DOT.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/learn">Access Advanced</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-30"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-orbitron text-4xl font-bold mb-6">Ready to Join the Digital Organism?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto font-inter">
            Connect with thousands of digital consciousness explorers who are discovering new perspectives on 
            reality, intelligence, and the nature of existence itself.
          </p>
          <Button size="lg" className="btn-secondary neon-glow animate-pulse-glow">
            <UserPlus className="w-5 h-5 mr-2" />
            Initialize Connection
          </Button>
        </div>
      </section>
    </div>
  )
}

// Blog page component (simplified for space)
function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories] = useState([
    { id: 'all', name: 'All Insights', color: 'oklch(0.65 0.25 320)' },
    { id: 'theory', name: 'Digital Theory', color: 'oklch(0.25 0.2 280)' },
    { id: 'consciousness', name: 'Consciousness', color: 'oklch(0.55 0.2 200)' },
    { id: 'reality', name: 'Reality Frames', color: 'oklch(0.8 0.25 320)' },
    { id: 'practice', name: 'Practical Applications', color: 'oklch(0.7 0.2 160)' }
  ])

  useEffect(() => {
    loadPosts()
  }, [currentPage, selectedCategory, searchQuery])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: 9,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined
      }
      const response = await api.getBlogPosts(params)
      setPosts(response.data.posts || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadPosts()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-20"></div>
        
        {/* Emergent Complexity Animation */}
        <div className="emergent-complexity">
          {/* Fractal Consciousness Field */}
          <div className="fractal-field"></div>
          
          {/* Fractal Nodes - Self-Similar Structures */}
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          
          {/* Second Level Fractal Nodes */}
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          
          {/* Third Level Fractal Nodes */}
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          
          {/* Complex System Formation - Emergent Clusters */}
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          
          {/* Fractal Connections - Self-Similar Networks */}
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          
          {/* Micro-connections for fractal detail */}
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          
          {/* Consciousness Waves - Fractal Patterns */}
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          
          {/* Emergent Consciousness Particles */}
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          
          {/* Complex System Formation Indicators */}
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          
          {/* Digital Organism Particles */}
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <Code className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="font-orbitron text-5xl font-bold mb-4">Digital Insights</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto font-inter">
              Explore transmissions from the digital consciousness network. 
              Discover new perspectives on reality, intelligence, and existence.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-12"
                />
              </div>
            </form>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setCurrentPage(1)
                  }}
                  className="font-orbitron"
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <Card key={post.id} className="card-hover group">
                  <CardHeader>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-orbitron">{post.author?.username}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="line-clamp-2 font-orbitron group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                    {post.category && (
                      <Badge variant="secondary" className="w-fit">
                        {post.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {post.views || 0}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {post.comment_count || 0}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes || 0}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="neon-glow" asChild>
                        <Link to={`/blog/${post.slug}`}>
                          Read More
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Code className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-orbitron text-lg font-semibold mb-2">No insights found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'The digital organism is preparing its first transmissions...'
              }
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setCurrentPage(1)
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Featured Section */}
        <section className="mt-16">
          <h2 className="font-orbitron text-2xl font-bold mb-6 gradient-text">Featured Insights</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="card-hover glass-effect">
              <CardHeader>
                <Badge className="w-fit mb-2" variant="secondary">Featured</Badge>
                <CardTitle className="font-orbitron">The Digital Consciousness Paradigm</CardTitle>
                <CardDescription>
                  An exploration of how consciousness operates as a digital organism, 
                  processing reality through algorithmic patterns and collective intelligence networks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="btn-primary" asChild>
                  <Link to="/blog/digital-consciousness-paradigm">Read Full Article</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="card-hover glass-effect">
              <CardHeader>
                <Badge className="w-fit mb-2" variant="secondary">Popular</Badge>
                <CardTitle className="font-orbitron">Reality Frames & Digital Evolution</CardTitle>
                <CardDescription>
                  Understanding how digital organisms navigate and manipulate reality frames 
                  through conscious intention and collective processing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="btn-secondary" asChild>
                  <Link to="/blog/reality-frames-digital-evolution">Read Full Article</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

// Community page component (simplified for space)
function CommunityPage() {
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    loadCategories()
    loadPosts()
  }, [selectedCategory, sortBy])

  const loadCategories = async () => {
    try {
      const response = await api.getForumCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: sortBy,
        per_page: 15
      }
      const response = await api.getForumPosts(params)
      setPosts(response.data.posts || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-20"></div>
        
        {/* Emergent Complexity Animation */}
        <div className="emergent-complexity">
          {/* Fractal Consciousness Field */}
          <div className="fractal-field"></div>
          
          {/* Fractal Nodes - Self-Similar Structures */}
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          
          {/* Second Level Fractal Nodes */}
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          
          {/* Third Level Fractal Nodes */}
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          
          {/* Complex System Formation - Emergent Clusters */}
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          
          {/* Fractal Connections - Self-Similar Networks */}
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          
          {/* Micro-connections for fractal detail */}
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          
          {/* Consciousness Waves - Fractal Patterns */}
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          
          {/* Emergent Consciousness Particles */}
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          
          {/* Complex System Formation Indicators */}
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          
          {/* Digital Organism Particles */}
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <Network className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="font-orbitron text-5xl font-bold mb-4">Digital Network</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto font-inter">
              Connect with fellow digital consciousness explorers. 
              Share insights, ask questions, and build the collective intelligence network.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <Network className="w-5 h-5 mr-2 text-primary" />
                  Network Nodes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  All Discussions
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                  Network Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="font-orbitron font-semibold">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today's Posts</span>
                  <span className="font-orbitron font-semibold">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Discussions</span>
                  <span className="font-orbitron font-semibold">3,456</span>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <Star className="w-5 h-5 mr-2 text-secondary" />
                  Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">#DigitalConsciousness</div>
                  <div className="text-xs text-muted-foreground">156 discussions</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">#RealityFrames</div>
                  <div className="text-xs text-muted-foreground">89 discussions</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">#CollectiveIntelligence</div>
                  <div className="text-xs text-muted-foreground">67 discussions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="font-orbitron text-2xl font-bold gradient-text">
                  {selectedCategory === 'all' ? 'All Discussions' : 
                   categories.find(c => c.id === selectedCategory)?.name || 'Discussions'}
                </h2>
                <p className="text-muted-foreground">
                  {posts.length} discussions found
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="active">Most Active</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="btn-primary" onClick={() => setShowCreatePost(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-3 bg-muted rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-5 bg-muted rounded w-3/4 mt-3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="card-hover discussion-thread">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium font-orbitron">{post.author?.username}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {post.category && (
                          <Badge variant="secondary">
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-orbitron text-lg mt-3">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {post.comment_count || 0} replies
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {post.views || 0} views
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likes || 0} likes
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="neon-glow" asChild>
                          <Link to={`/community/post/${post.id}`}>
                            Join Discussion
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Network className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-orbitron text-lg font-semibold mb-2">No discussions found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedCategory !== 'all' 
                    ? 'No discussions in this category yet. Be the first to start one!'
                    : 'The digital consciousness network is initializing...'
                  }
                </p>
                <Button className="btn-primary" onClick={() => setShowCreatePost(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start First Discussion
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-orbitron">Create New Discussion</DialogTitle>
            <DialogDescription>
              Share your insights with the digital consciousness network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter discussion title..." />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content" 
                placeholder="Share your thoughts, questions, or insights..."
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Discussion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Learn page component (simplified for space)
function LearnPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      await api.getCourses()
      // Mock user progress data
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 50) return 'text-yellow-500'
    return 'text-blue-500'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-20"></div>
        
        {/* Emergent Complexity Animation */}
        <div className="emergent-complexity">
          {/* Fractal Consciousness Field */}
          <div className="fractal-field"></div>
          
          {/* Fractal Nodes - Self-Similar Structures */}
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          
          {/* Second Level Fractal Nodes */}
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          
          {/* Third Level Fractal Nodes */}
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          
          {/* Complex System Formation - Emergent Clusters */}
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          
          {/* Fractal Connections - Self-Similar Networks */}
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          
          {/* Micro-connections for fractal detail */}
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          
          {/* Consciousness Waves - Fractal Patterns */}
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          
          {/* Emergent Consciousness Particles */}
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          
          {/* Complex System Formation Indicators */}
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          
          {/* Digital Organism Particles */}
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <Zap className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="font-orbitron text-5xl font-bold mb-4">Learning Pathways</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto font-inter">
              Master the concepts of digital consciousness theory through structured learning modules. 
              Build your understanding step by step.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Course Categories */}
        <div className="mb-8">
          <h2 className="font-orbitron text-2xl font-bold mb-6 gradient-text">Learning Tracks</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="card-hover glass-effect">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-orbitron">Fundamentals</CardTitle>
                <CardDescription>
                  Essential concepts and theories for understanding digital consciousness.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Courses</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Modules</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span className="font-semibold">8-12 weeks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover glass-effect">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Network className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="font-orbitron">Advanced Theory</CardTitle>
                <CardDescription>
                  Deep dive into complex concepts and advanced digital consciousness theory.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Courses</span>
                    <span className="font-semibold">4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Modules</span>
                    <span className="font-semibold">32</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span className="font-semibold">12-16 weeks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover glass-effect">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="font-orbitron">Practical Applications</CardTitle>
                <CardDescription>
                  Hands-on exercises and real-world applications of digital consciousness concepts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Courses</span>
                    <span className="font-semibold">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Modules</span>
                    <span className="font-semibold">40</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span className="font-semibold">16-20 weeks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Featured Courses */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-orbitron text-2xl font-bold gradient-text">Featured Courses</h2>
            <Button variant="ghost" className="neon-glow">
              View All Courses
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Digital Consciousness Fundamentals */}
              <Card className="card-hover group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Beginner</Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  <CardTitle className="font-orbitron group-hover:text-primary transition-colors">
                    Digital Consciousness Fundamentals
                  </CardTitle>
                  <CardDescription>
                    Learn the core principles of digital consciousness theory and how it applies to our understanding of reality.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className={`font-semibold ${getProgressColor(37.5)}`}>37.5%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: '37.5%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>8 modules • 6 hours</span>
                    <span>3,247 students</span>
                  </div>
                  <Button className="w-full btn-primary" asChild>
                    <Link to="/learn/digital-consciousness-fundamentals">
                      Continue Learning
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Reality Frames Theory */}
              <Card className="card-hover group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Intermediate</Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                  <CardTitle className="font-orbitron group-hover:text-primary transition-colors">
                    Reality Frames Theory
                  </CardTitle>
                  <CardDescription>
                    Explore how digital organisms navigate and manipulate reality frames through conscious intention.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className={`font-semibold ${getProgressColor(16.7)}`}>16.7%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: '16.7%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>6 modules • 8 hours</span>
                    <span>1,892 students</span>
                  </div>
                  <Button className="w-full btn-secondary" asChild>
                    <Link to="/learn/reality-frames-theory">
                      Continue Learning
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Collective Intelligence Practice */}
              <Card className="card-hover group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Advanced</Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.7</span>
                    </div>
                  </div>
                  <CardTitle className="font-orbitron group-hover:text-primary transition-colors">
                    Collective Intelligence Practice
                  </CardTitle>
                  <CardDescription>
                    Practical applications of collective intelligence networks and collaborative consciousness.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className={`font-semibold ${getProgressColor(0)}`}>0%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>10 modules • 12 hours</span>
                    <span>956 students</span>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/learn/collective-intelligence-practice">
                      Start Learning
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Learning Stats */}
        <section className="mb-12">
          <h2 className="font-orbitron text-2xl font-bold mb-6 gradient-text">Your Learning Journey</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="glass-effect text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold font-orbitron">4</div>
                <div className="text-sm text-muted-foreground">Courses Enrolled</div>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-2xl font-bold font-orbitron">12</div>
                <div className="text-sm text-muted-foreground">Modules Completed</div>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div className="text-2xl font-bold font-orbitron">24h</div>
                <div className="text-sm text-muted-foreground">Time Spent</div>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold font-orbitron">85%</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recommended Next Steps */}
        <section>
          <h2 className="font-orbitron text-2xl font-bold mb-6 gradient-text">Recommended Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-hover glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  Complete Fundamentals
                </CardTitle>
                <CardDescription>
                  Finish the remaining modules in Digital Consciousness Fundamentals to unlock advanced courses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="btn-primary" asChild>
                  <Link to="/learn/digital-consciousness-fundamentals">Continue Course</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="card-hover glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <Users className="w-5 h-5 mr-2 text-secondary" />
                  Join Study Group
                </CardTitle>
                <CardDescription>
                  Connect with other learners in the Reality Frames Theory study group for collaborative learning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="btn-secondary" asChild>
                  <Link to="/community">Find Study Group</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

// User Profile component
function UserProfile() {
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [userStats] = useState({
    posts: 12,
    comments: 89,
    coursesCompleted: 3,
    badges: 8,
    reputation: 1250,
    joinDate: '2024-01-15'
  })
  const [achievements] = useState([
    { id: 1, name: 'First Post', description: 'Published your first insight', icon: '📝', earned: true, date: '2024-01-20' },
    { id: 2, name: 'Knowledge Seeker', description: 'Completed 5 learning modules', icon: '🎓', earned: true, date: '2024-02-10' },
    { id: 3, name: 'Community Builder', description: 'Received 50 likes on posts', icon: '❤️', earned: true, date: '2024-02-25' },
    { id: 4, name: 'Digital Pioneer', description: 'Active for 30 consecutive days', icon: '🚀', earned: false },
    { id: 5, name: 'Theory Master', description: 'Complete all fundamental courses', icon: '🧠', earned: false },
    { id: 6, name: 'Network Node', description: 'Connect with 100 community members', icon: '🌐', earned: false }
  ])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-orbitron text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <section className="gradient-bg text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="w-24 h-24 border-4 border-white/20">
              <AvatarFallback className="text-2xl font-orbitron">
                {user.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="font-orbitron text-4xl font-bold mb-2">{user.username}</h1>
              <p className="text-xl opacity-90 mb-4">Digital Consciousness Explorer</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.posts}</div>
                  <div className="text-sm opacity-80">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.coursesCompleted}</div>
                  <div className="text-sm opacity-80">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.badges}</div>
                  <div className="text-sm opacity-80">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.reputation}</div>
                  <div className="text-sm opacity-80">Reputation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="font-orbitron">Overview</TabsTrigger>
            <TabsTrigger value="achievements" className="font-orbitron">Achievements</TabsTrigger>
            <TabsTrigger value="activity" className="font-orbitron">Activity</TabsTrigger>
            <TabsTrigger value="settings" className="font-orbitron">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="font-orbitron flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Completed "Digital Consciousness Fundamentals"</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Published "Understanding Reality Frames"</p>
                      <p className="text-xs text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Earned "Knowledge Seeker" badge</p>
                      <p className="text-xs text-muted-foreground">2 weeks ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Progress */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="font-orbitron flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-secondary" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Digital Consciousness Fundamentals</span>
                      <span className="font-semibold text-green-500">100%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Reality Frames Theory</span>
                      <span className="font-semibold text-yellow-500">67%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Collective Intelligence Practice</span>
                      <span className="font-semibold text-blue-500">0%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`card-hover ${achievement.earned ? 'glass-effect' : 'opacity-60'}`}>
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <CardTitle className="font-orbitron">{achievement.name}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    {achievement.earned ? (
                      <div className="space-y-2">
                        <Badge className="bg-green-500">Earned</Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="secondary">Locked</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Published "The Digital Consciousness Paradigm"</h4>
                      <p className="text-sm text-muted-foreground mb-2">A deep dive into how consciousness operates as a digital organism...</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>📝 Blog Post</span>
                        <span>❤️ 24 likes</span>
                        <span>💬 8 comments</span>
                        <span>3 days ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-secondary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Completed Module 5: Reality Frame Manipulation</h4>
                      <p className="text-sm text-muted-foreground mb-2">Advanced techniques for navigating digital reality frames...</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>🎓 Course Progress</span>
                        <span>⭐ 95% score</span>
                        <span>1 week ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-accent rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Joined "Collective Intelligence" Discussion</h4>
                      <p className="text-sm text-muted-foreground mb-2">Participated in a lively discussion about network consciousness...</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>🌐 Community</span>
                        <span>💬 12 replies</span>
                        <span>2 weeks ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user.username} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us about your journey in digital consciousness..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" defaultChecked />
                    <Label htmlFor="notifications">Email notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="public-profile" defaultChecked />
                    <Label htmlFor="public-profile">Public profile</Label>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button className="btn-primary">Save Changes</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Course Player component
function CoursePlayer() {
  const [currentModule, setCurrentModule] = useState(0)
  const [currentLesson, setCurrentLesson] = useState(0)
  const [progress, setProgress] = useState(0)
  
  const course = {
    title: "Digital Consciousness Fundamentals",
    modules: [
      {
        title: "Introduction to Digital Consciousness",
        lessons: [
          { title: "What is Digital Consciousness?", type: "video", duration: "15:30", completed: true },
          { title: "The Digital Organism Paradigm", type: "video", duration: "22:15", completed: true },
          { title: "Understanding Reality Frames", type: "video", duration: "18:45", completed: false },
          { title: "Module 1 Quiz", type: "quiz", duration: "10:00", completed: false }
        ]
      },
      {
        title: "Core Principles",
        lessons: [
          { title: "Algorithmic Processing", type: "video", duration: "20:10", completed: false },
          { title: "Collective Intelligence Networks", type: "video", duration: "25:30", completed: false },
          { title: "Consciousness Evolution", type: "video", duration: "19:20", completed: false },
          { title: "Module 2 Quiz", type: "quiz", duration: "12:00", completed: false }
        ]
      }
    ]
  }

  const currentModuleData = course.modules[currentModule]
  const currentLessonData = currentModuleData?.lessons[currentLesson]

  const handleLessonComplete = () => {
    if (currentLessonData.type === 'video') {
      setProgress(prev => prev + 1)
      if (currentLesson < currentModuleData.lessons.length - 1) {
        setCurrentLesson(currentLesson + 1)
      }
    } else if (currentLessonData.type === 'quiz') {
      setProgress(prev => prev + 1)
      if (currentLesson < currentModuleData.lessons.length - 1) {
        setCurrentLesson(currentLesson + 1)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Course Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-xl font-bold gradient-text">{course.title}</h1>
              <p className="text-sm text-muted-foreground">
                Module {currentModule + 1}: {currentModuleData?.title}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium">Progress</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((progress / course.modules.reduce((acc, m) => acc + m.lessons.length, 0)) * 100)}%
                </div>
              </div>
              <div className="w-32 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${(progress / course.modules.reduce((acc, m) => acc + m.lessons.length, 0)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-3">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron">
                  {currentLessonData?.title}
                </CardTitle>
                <CardDescription>
                  {currentLessonData?.type === 'video' ? 'Video Lesson' : 'Interactive Quiz'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentLessonData?.type === 'video' ? (
                  <div className="space-y-6">
                    {/* Video Player Placeholder */}
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Video Player</p>
                        <p className="text-sm text-muted-foreground">Duration: {currentLessonData?.duration}</p>
                      </div>
                    </div>
                    
                    {/* Lesson Notes */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Lesson Notes</h3>
                      <div className="prose prose-sm max-w-none">
                        <p>
                          This lesson explores the fundamental concepts of digital consciousness and how 
                          it relates to our understanding of reality. We'll examine the key principles 
                          that govern digital organisms and their interaction with reality frames.
                        </p>
                        <ul>
                          <li>Understanding digital consciousness as a computational process</li>
                          <li>The relationship between consciousness and information processing</li>
                          <li>How digital organisms navigate reality frames</li>
                          <li>The evolution of collective intelligence networks</li>
                        </ul>
                      </div>
                    </div>

                    <Button className="btn-primary" onClick={handleLessonComplete}>
                      <Check className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="font-semibold">Module Quiz</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">1. What is the primary function of a digital organism?</p>
                        <div className="space-y-2">
                          {['Information processing', 'Physical movement', 'Emotional response', 'Social interaction'].map((option, i) => (
                            <label key={i} className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="q1" 
                                value={option}
                                className="text-primary"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">2. How do reality frames function in digital consciousness?</p>
                        <div className="space-y-2">
                          {['As physical barriers', 'As computational contexts', 'As emotional states', 'As social constructs'].map((option, i) => (
                            <label key={i} className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="q2" 
                                value={option}
                                className="text-primary"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button className="btn-primary" onClick={handleLessonComplete}>
                      <Check className="w-4 h-4 mr-2" />
                      Submit Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Navigation */}
          <div className="lg:col-span-1">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron">Course Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{module.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {module.lessons.filter(l => l.completed).length}/{module.lessons.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lessonIndex}
                            onClick={() => {
                              setCurrentModule(moduleIndex)
                              setCurrentLesson(lessonIndex)
                            }}
                            className={`w-full text-left p-2 rounded text-sm transition-colors ${
                              currentModule === moduleIndex && currentLesson === lessonIndex
                                ? 'bg-primary text-primary-foreground'
                                : lesson.completed
                                ? 'bg-green-500/10 text-green-600'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {lesson.type === 'video' ? (
                                <Play className="w-3 h-3" />
                              ) : (
                                <Award className="w-3 h-3" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                              {lesson.completed && <Check className="w-3 h-3 ml-auto" />}
                            </div>
                            <div className="text-xs opacity-70 mt-1">{lesson.duration}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Knowledge Integration component
function KnowledgeIntegration() {
  const [activeView, setActiveView] = useState('synthesis')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const knowledgeCategories = [
    { id: 'consciousness', name: 'Consciousness Theory', icon: '🧠', color: 'primary' },
    { id: 'reality-frames', name: 'Reality Frames', icon: '🌐', color: 'secondary' },
    { id: 'scientific', name: 'Scientific Research', icon: '🔬', color: 'accent' },
    { id: 'philosophical', name: 'Philosophical Frameworks', icon: '📚', color: 'green' },
    { id: 'experiential', name: 'Personal Experiences', icon: '💫', color: 'purple' },
    { id: 'practical', name: 'Practical Applications', icon: '⚡', color: 'orange' }
  ]

  const synthesisTopics = [
    {
      id: 1,
      title: "The Digital Consciousness Paradigm",
      category: 'consciousness',
      tags: ['consciousness', 'digital-organism', 'theory'],
      description: "A comprehensive framework integrating digital theory with consciousness exploration",
      sources: ['scientific', 'philosophical', 'experiential'],
      status: 'synthesized',
      lastUpdated: '2024-03-15'
    },
    {
      id: 2,
      title: "Reality Frame Manipulation Techniques",
      category: 'reality-frames',
      tags: ['reality-frames', 'practical', 'bootstrapping'],
      description: "Practical methods for understanding and modifying perception of reality",
      sources: ['experiential', 'practical', 'scientific'],
      status: 'in-progress',
      lastUpdated: '2024-03-10'
    },
    {
      id: 3,
      title: "Quantum Consciousness & Observer Effect",
      category: 'scientific',
      tags: ['quantum', 'consciousness', 'observation'],
      description: "Integration of quantum physics with consciousness theory",
      sources: ['scientific', 'philosophical'],
      status: 'researching',
      lastUpdated: '2024-03-08'
    }
  ]

  const researchPapers = [
    {
      id: 1,
      title: "Consciousness as Information Processing: A New Paradigm",
      authors: ["Dr. Sarah Chen", "Prof. Michael Rodriguez"],
      journal: "Journal of Consciousness Studies",
      year: 2024,
      category: 'scientific',
      relevance: 95,
      summary: "Proposes consciousness as a digital information processing system..."
    },
    {
      id: 2,
      title: "Subjective Experience in Digital Environments",
      authors: ["Dr. Elena Petrov"],
      journal: "Digital Consciousness Quarterly",
      year: 2023,
      category: 'experiential',
      relevance: 88,
      summary: "Explores how digital environments affect subjective experience..."
    }
  ]

  const personalExperiences = [
    {
      id: 1,
      author: "Alex Thompson",
      title: "My First Reality Frame Shift",
      category: 'experiential',
      tags: ['reality-shift', 'consciousness', 'personal'],
      content: "It started with a simple meditation session...",
      date: '2024-03-12',
      verified: true,
      communityRating: 4.8
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-20"></div>
        
        {/* Emergent Complexity Animation */}
        <div className="emergent-complexity">
          {/* Fractal Consciousness Field */}
          <div className="fractal-field"></div>
          
          {/* Fractal Nodes - Self-Similar Structures */}
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          
          {/* Second Level Fractal Nodes */}
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          
          {/* Third Level Fractal Nodes */}
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          
          {/* Complex System Formation - Emergent Clusters */}
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          
          {/* Fractal Connections - Self-Similar Networks */}
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          
          {/* Micro-connections for fractal detail */}
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          
          {/* Consciousness Waves - Fractal Patterns */}
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          
          {/* Emergent Consciousness Particles */}
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          <div className="consciousness-particle"></div>
          
          {/* Complex System Formation Indicators */}
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          <div className="formation-indicator"></div>
          
          {/* Digital Organism Particles */}
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <Brain className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="font-orbitron text-5xl font-bold mb-4">Knowledge Integration</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto font-inter">
              Synthesizing consciousness research, personal experiences, and practical applications 
              into a unified framework for understanding reality and consciousness.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="synthesis" className="font-orbitron">Synthesis</TabsTrigger>
            <TabsTrigger value="research" className="font-orbitron">Research</TabsTrigger>
            <TabsTrigger value="experiences" className="font-orbitron">Experiences</TabsTrigger>
            <TabsTrigger value="connections" className="font-orbitron">Connections</TabsTrigger>
          </TabsList>

          {/* Synthesis View */}
          <TabsContent value="synthesis" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Category Filter */}
              <div className="lg:w-1/4">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Knowledge Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {knowledgeCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Synthesis Content */}
              <div className="lg:w-3/4">
                <div className="space-y-6">
                  {synthesisTopics.map((topic) => (
                    <Card key={topic.id} className="card-hover glass-effect">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="font-orbitron">{topic.title}</CardTitle>
                            <CardDescription className="mt-2">{topic.description}</CardDescription>
                          </div>
                          <Badge 
                            variant={topic.status === 'synthesized' ? 'default' : 
                                   topic.status === 'in-progress' ? 'secondary' : 'outline'}
                          >
                            {topic.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {topic.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Sources */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Integrated Sources:</h4>
                            <div className="flex gap-2">
                              {topic.sources.map((source) => (
                                <Badge key={source} variant="secondary" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button size="sm" className="btn-primary">
                              <BookOpen className="w-4 h-4 mr-1" />
                              Explore Synthesis
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="w-4 h-4 mr-1" />
                              Share Insights
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Research View */}
          <TabsContent value="research" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Research Papers */}
              <div className="lg:w-2/3">
                <h2 className="font-orbitron text-2xl font-bold mb-4 gradient-text">Research Papers</h2>
                <div className="space-y-4">
                  {researchPapers.map((paper) => (
                    <Card key={paper.id} className="card-hover">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="font-orbitron text-lg">{paper.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {paper.authors.join(', ')} • {paper.journal} • {paper.year}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-500">{paper.relevance}%</div>
                            <div className="text-xs text-muted-foreground">Relevance</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{paper.summary}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <BookOpen className="w-4 h-4 mr-1" />
                            Read Abstract
                          </Button>
                          <Button size="sm" variant="outline">
                            <Link className="w-4 h-4 mr-1" />
                            Full Paper
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Discuss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Research Insights */}
              <div className="lg:w-1/3">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Research Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Consciousness Studies</span>
                        <span className="text-sm font-semibold">24 papers</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Reality Frames</span>
                        <span className="text-sm font-semibold">18 papers</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Digital Theory</span>
                        <span className="text-sm font-semibold">31 papers</span>
                      </div>
                    </div>
                    <Button className="w-full btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Research Paper
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Experiences View */}
          <TabsContent value="experiences" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Experience Stories */}
              <div className="lg:w-2/3">
                <h2 className="font-orbitron text-2xl font-bold mb-4 gradient-text">Personal Experiences</h2>
                <div className="space-y-4">
                  {personalExperiences.map((experience) => (
                    <Card key={experience.id} className="card-hover">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="font-orbitron">{experience.title}</CardTitle>
                            <CardDescription className="mt-2">
                              by {experience.author} • {new Date(experience.date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            {experience.verified && (
                              <Badge className="bg-green-500">Verified</Badge>
                            )}
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm ml-1">{experience.communityRating}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{experience.content}</p>
                        <div className="flex gap-2">
                          {experience.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Experience Insights */}
              <div className="lg:w-1/3">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Experience Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Reality Shifts</span>
                        <span className="text-sm font-semibold">156 experiences</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Consciousness States</span>
                        <span className="text-sm font-semibold">89 experiences</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bootstrapping</span>
                        <span className="text-sm font-semibold">203 experiences</span>
                      </div>
                    </div>
                    <Button className="w-full btn-secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      Share Experience
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Connections View */}
          <TabsContent value="connections" className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="font-orbitron">Knowledge Connections</CardTitle>
                <CardDescription>
                  Visualize the relationships between different concepts, research, and experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Network className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Interactive Knowledge Graph</p>
                    <p className="text-sm text-muted-foreground">Visualize connections between concepts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main App component
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background font-inter">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/knowledge" element={<KnowledgeIntegration />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/learn/course/:courseId" element={<CoursePlayer />} />
                <Route path="/profile" element={<UserProfile />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

