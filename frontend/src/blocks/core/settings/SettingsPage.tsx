import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Switch } from '../../../shared/components/ui/switch';
import { Label } from '../../../shared/components/ui/label';
import { Separator } from '../../../shared/components/ui/separator';
import { 
  Settings, 
  Palette,
  Bell, 
  Shield, 
  BookOpen, 
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';
import { useTheme } from '../../../shared/contexts/SimpleThemeContext';
import ModernThemeToggle from '../../../shared/components/ui/ModernThemeToggle';

const SettingsPage: React.FC = () => {
  const { theme, getThemesByCategory } = useTheme();
  
  // Get current theme info
  const categorizedThemes = getThemesByCategory();
  const allThemes: Record<string, any> = {};
  Object.values(categorizedThemes).forEach(category => {
    Object.assign(allThemes, category);
  });
  const currentTheme = allThemes[theme];
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      marketing: false,
      newArticles: true,
      communityUpdates: true
    },
    reading: {
      autoOptimize: true,
      fontSize: 'medium',
      lineHeight: 'comfortable',
      wordSpacing: 'normal'
    },
    privacy: {
      profileVisibility: 'public',
      activityTracking: true,
      dataCollection: false
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      keyboardNavigation: true
    }
  });
  const handleSettingChange = (category: string, setting: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const saveSettings = () => {
    // Implementation for saving settings
    console.log('Settings saved:', settings);
    // Add visual feedback
    const button = document.querySelector('[data-save-button]') as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Saved!';
      button.classList.add('bg-green-500', 'hover:bg-green-600');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-500', 'hover:bg-green-600');
      }, 2000);
    }
  };

  const resetSettings = () => {
    // Implementation for resetting to defaults
    setSettings({
      notifications: {
        email: true,
        push: false,
        marketing: false,
        newArticles: true,
        communityUpdates: true
      },
      reading: {
        autoOptimize: true,
        fontSize: 'medium',
        lineHeight: 'comfortable',
        wordSpacing: 'normal'
      },
      privacy: {
        profileVisibility: 'public',
        activityTracking: true,
        dataCollection: false
      },
      accessibility: {
        reduceMotion: false,
        highContrast: false,
        keyboardNavigation: true
      }
    });
    console.log('Settings reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold gradient-text">Settings</h1>
              <p className="text-muted-foreground">Customize your DOT Platform experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Theme & Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Theme & Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Current Theme</Label>
                <div className="flex items-center space-x-3 p-3 bg-accent/20 rounded-lg">
                  <span className="text-2xl">{currentTheme?.icon}</span>
                  <div>
                    <div className="font-medium">{currentTheme?.name}</div>
                    <div className="text-sm text-muted-foreground">{currentTheme?.description}</div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {currentTheme?.category}
                  </Badge>
                </div>
              </div>              
              <Separator className="" />
                  <div>
                <Label className="text-sm font-medium mb-3 block">Theme Selection</Label>
                <div className="space-y-4">
                  <ModernThemeToggle />
                  <p className="text-sm text-muted-foreground">
                    Choose from our collection of themes optimized for reading, productivity, and consciousness exploration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reading Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Reading Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-optimize">Auto-optimize for reading</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply reading optimizations like improved line spacing and typography
                  </p>
                </div>                <Switch                  id="auto-optimize"
                  checked={settings.reading.autoOptimize}
                  onCheckedChange={(checked: boolean) => handleSettingChange('reading', 'autoOptimize', checked)}
                  className=""
                />
              </div>
              
              <Separator className="" />
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Font Size</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    value={settings.reading.fontSize}
                    onChange={(e) => handleSettingChange('reading', 'fontSize', e.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Line Height</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    value={settings.reading.lineHeight}
                    onChange={(e) => handleSettingChange('reading', 'lineHeight', e.target.value)}
                  >
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="relaxed">Relaxed</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Word Spacing</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    value={settings.reading.wordSpacing}
                    onChange={(e) => handleSettingChange('reading', 'wordSpacing', e.target.value)}
                  >
                    <option value="tight">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="loose">Loose</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">              {Object.entries({
                email: 'Email notifications',
                push: 'Push notifications',
                marketing: 'Marketing communications',
                newArticles: 'New articles and content',
                communityUpdates: 'Community updates'
              }).map(([key, label]) => (                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key}>{label}</Label>
                  <Switch
                    id={key}
                    checked={settings.notifications[key as keyof typeof settings.notifications]}
                    onCheckedChange={(checked: boolean) => handleSettingChange('notifications', key, checked)}
                    className=""
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Profile Visibility</Label>
                <select 
                  className="w-full mt-1 p-2 border rounded-lg bg-background"
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="community">Community Members Only</option>
                  <option value="private">Private</option>
                </select>              </div>
              
              <Separator className="" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="activity-tracking">Activity tracking</Label>                  <p className="text-sm text-muted-foreground">
                    Allow tracking of reading progress and learning analytics
                  </p>
                </div>
                <Switch
                  id="activity-tracking"
                  checked={settings.privacy.activityTracking}
                  onCheckedChange={(checked: boolean) => handleSettingChange('privacy', 'activityTracking', checked)}
                  className=""
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-collection">Enhanced data collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve the platform with anonymous usage data
                  </p>                </div>
                <Switch
                  id="data-collection"
                  checked={settings.privacy.dataCollection}
                  onCheckedChange={(checked: boolean) => handleSettingChange('privacy', 'dataCollection', checked)}
                  className=""
                />
              </div>
            </CardContent>
          </Card>

          {/* Accessibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Accessibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>                  <Label htmlFor="reduce-motion">Reduce motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={settings.accessibility.reduceMotion}
                  onCheckedChange={(checked: boolean) => handleSettingChange('accessibility', 'reduceMotion', checked)}
                  className=""
                />
              </div>
              
              <div className="flex items-center justify-between">                <div>
                  <Label htmlFor="high-contrast">High contrast mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.accessibility.highContrast}
                  onCheckedChange={(checked: boolean) => handleSettingChange('accessibility', 'highContrast', checked)}
                  className=""
                />
              </div>
              
              <div className="flex items-center justify-between">                <div>
                  <Label htmlFor="keyboard-nav">Enhanced keyboard navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Improved keyboard accessibility features
                  </p>
                </div>
                <Switch
                  id="keyboard-nav"
                  checked={settings.accessibility.keyboardNavigation}
                  onCheckedChange={(checked: boolean) => handleSettingChange('accessibility', 'keyboardNavigation', checked)}
                  className=""
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={saveSettings} 
              className="flex items-center space-x-2 flex-1"
              data-save-button
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </Button>
            <Button variant="outline" onClick={resetSettings} className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
