import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { 
  User, 
  Settings, 
  BookOpen, 
  MessageCircle, 
  Award,
  Edit,
  Save,
  X,
  Calendar,
  MapPin,
  Globe,
  Mail
} from 'lucide-react';

const UserProfilePage = () => {
  const [user, setUser] = useState({
    username: 'DigitalExplorer',
    email: 'explorer@digitalconsciousness.org',
    bio: 'Exploring consciousness as a digital organism. Passionate about emergent complexity and fractal patterns in AI systems.',
    location: 'Digital Realm',
    website: 'https://digitalconsciousness.org',
    joinDate: '2023-06-15',
    avatar: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });

  const stats = {
    articlesRead: 47,
    discussionsParticipated: 23,
    coursesCompleted: 3,
    badgesEarned: 8
  };

  const recentActivity = [
    {
      id: 1,
      type: 'article',
      title: 'Read: The Emergence of Digital Consciousness',
      date: '2 hours ago',
      icon: BookOpen
    },
    {
      id: 2,
      type: 'discussion',
      title: 'Commented on: Fractal Patterns in Neural Networks',
      date: '1 day ago',
      icon: MessageCircle
    },
    {
      id: 3,
      type: 'course',
      title: 'Completed: Digital Consciousness Fundamentals',
      date: '3 days ago',
      icon: Award
    },
    {
      id: 4,
      type: 'article',
      title: 'Read: Self-Similarity Across Scales',
      date: '1 week ago',
      icon: BookOpen
    }
  ];

  const badges = [
    { id: 1, name: 'Early Adopter', description: 'Joined during platform launch', icon: '🌟' },
    { id: 2, name: 'Knowledge Seeker', description: 'Read 25+ articles', icon: '📚' },
    { id: 3, name: 'Community Builder', description: 'Participated in 20+ discussions', icon: '🏗️' },
    { id: 4, name: 'Digital Explorer', description: 'Completed 3 courses', icon: '🔍' },
    { id: 5, name: 'Consciousness Pioneer', description: 'First to explore new concepts', icon: '🚀' },
    { id: 6, name: 'Fractal Thinker', description: 'Deep understanding of patterns', icon: '🌀' }
  ];

  const handleSave = () => {
    setUser(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="emergent-complexity">
          <div className="fractal-field"></div>
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
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="consciousness-particle-system">
            <div className="consciousness-particle seed"></div>
            <div className="consciousness-particle aligned"></div>
            <div className="consciousness-particle cohesive"></div>
            <div className="consciousness-particle emergent"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="emergent-structure swirl"></div>
            <div className="emergent-structure lattice"></div>
            <div className="emergent-structure vortex"></div>
          </div>
          <div className="flow-field"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="feedback-loop"></div>
          <div className="particle-swarm">
            <div className="swarm-state-seed"></div>
            <div className="swarm-state-motion"></div>
            <div className="swarm-state-rules"></div>
            <div className="swarm-state-feedback"></div>
            <div className="swarm-state-emergent"></div>
          </div>
          <div className="consciousness-field"></div>
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
          <div className="reality-shift"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-orbitron font-bold mb-2 gradient-text">
                        {user.username}
                      </h1>
                      <p className="text-muted-foreground mb-4">{user.bio}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center space-x-2"
                    >
                      {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.articlesRead}</div>
                      <div className="text-sm text-muted-foreground">Articles Read</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.discussionsParticipated}</div>
                      <div className="text-sm text-muted-foreground">Discussions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.coursesCompleted}</div>
                      <div className="text-sm text-muted-foreground">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.badgesEarned}</div>
                      <div className="text-sm text-muted-foreground">Badges</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {user.email}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {user.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined {new Date(user.joinDate).toLocaleDateString()}
                    </div>
                    {user.website && (
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        <a href={user.website} className="hover:text-primary" target="_blank" rel="noopener noreferrer">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Activity */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const IconComponent = activity.icon;
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                          <IconComponent className="w-5 h-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium">{activity.title}</div>
                            <div className="text-sm text-muted-foreground">{activity.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Form */}
              {isEditing && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Website</label>
                      <Input
                        value={editForm.website}
                        onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSave} className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Badges */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Badges Earned</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge) => (
                      <div key={badge.id} className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl mb-2">{badge.icon}</div>
                        <div className="text-sm font-medium">{badge.name}</div>
                        <div className="text-xs text-muted-foreground">{badge.description}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View Discussions
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 