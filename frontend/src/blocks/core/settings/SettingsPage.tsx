import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
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
import { useSettings } from '../../../forms/hooks/useSettings';
import { type SettingsPageData } from '../../../forms/schemas/settingsPage';
import { Select, Toggle } from '../../../forms/components';

const SettingsPage: React.FC = () => {
  const { theme, getThemesByCategory } = useTheme();
  
  // Get current theme info
  const categorizedThemes = getThemesByCategory();
  const allThemes: Record<string, any> = {};
  Object.values(categorizedThemes).forEach(category => {
    Object.assign(allThemes, category);
  });
  const currentTheme = allThemes[theme];

  const {
    form,
    isLoading,
    isDirty,
    saveStatus,
    lastSaved,
    isAutoSaving,
    handleSave,
    handleReset,
  } = useSettings({
    enableAutoSave: true,
    onSave: async (data: SettingsPageData) => {
      // Simulate API call
      console.log('Saving settings:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onReset: () => {
      console.log('Settings reset to defaults');
    },
  });

  const { watch } = form;
  const settings = watch();

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
              <Toggle
                id="auto-optimize"
                label="Auto-optimize for reading"
                description="Automatically apply reading optimizations like improved line spacing and typography"
                checked={settings.reading?.autoOptimize || false}
                onChange={(checked) => 
                  form.setValue('reading.autoOptimize', checked, { shouldDirty: true })
                }
              />
              
              <Separator className="" />
              
              <div className="grid md:grid-cols-3 gap-4">
                <Select
                  name="reading.fontSize"
                  control={form.control}
                  label="Font Size"
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                    { value: 'extra-large', label: 'Extra Large' }
                  ]}
                />
                
                <Select
                  name="reading.lineHeight"
                  control={form.control}
                  label="Line Height"
                  options={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'relaxed', label: 'Relaxed' }
                  ]}
                />
                
                <Select
                  name="reading.wordSpacing"
                  control={form.control}
                  label="Word Spacing"
                  options={[
                    { value: 'tight', label: 'Tight' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'loose', label: 'Loose' }
                  ]}
                />
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
            <CardContent className="space-y-6">
              {Object.entries({
                email: 'Email notifications',
                push: 'Push notifications',
                marketing: 'Marketing communications',
                newArticles: 'New articles and content',
                communityUpdates: 'Community updates'
              }).map(([key, label]) => (
                <Toggle
                  key={key}
                  id={key}
                  label={label}
                  checked={settings.notifications?.[key as keyof typeof settings.notifications] || false}
                  onChange={(checked) =>
                    form.setValue(`notifications.${key}` as any, checked, { shouldDirty: true })
                  }
                />
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
              <Select
                name="privacy.profileVisibility"
                control={form.control}
                label="Profile Visibility"
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'community', label: 'Community Members Only' },
                  { value: 'private', label: 'Private' }
                ]}
              />
              
              <Separator className="" />
              
              <Toggle
                id="activity-tracking"
                label="Activity tracking"
                description="Allow tracking of reading progress and learning analytics"
                checked={settings.privacy?.activityTracking || false}
                onChange={(checked) =>
                  form.setValue('privacy.activityTracking', checked, { shouldDirty: true })
                }
              />
              
              <Toggle
                id="data-collection"
                label="Enhanced data collection"
                description="Help improve the platform with anonymous usage data"
                checked={settings.privacy?.dataCollection || false}
                onChange={(checked) =>
                  form.setValue('privacy.dataCollection', checked, { shouldDirty: true })
                }
              />
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
              <Toggle
                id="reduce-motion"
                label="Reduce motion"
                description="Minimize animations and transitions"
                checked={settings.accessibility?.reduceMotion || false}
                onChange={(checked) =>
                  form.setValue('accessibility.reduceMotion', checked, { shouldDirty: true })
                }
              />
              
              <Toggle
                id="high-contrast"
                label="High contrast mode"
                description="Increase contrast for better visibility"
                checked={settings.accessibility?.highContrast || false}
                onChange={(checked) =>
                  form.setValue('accessibility.highContrast', checked, { shouldDirty: true })
                }
              />
              
              <Toggle
                id="keyboard-nav"
                label="Enhanced keyboard navigation"
                description="Improved keyboard accessibility features"
                checked={settings.accessibility?.keyboardNavigation || false}
                onChange={(checked) =>
                  form.setValue('accessibility.keyboardNavigation', checked, { shouldDirty: true })
                }
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleSave} 
              className="flex items-center space-x-2 flex-1"
              disabled={!isDirty || isLoading}
              data-save-button
            >
              <Save className="w-4 h-4" />
              <span>
                {saveStatus === 'saving' ? 'Saving...' :
                 saveStatus === 'saved' ? 'Saved!' :
                 saveStatus === 'error' ? 'Error!' : 
                 'Save Settings'}
              </span>
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </Button>
          </div>

          {/* Status indicators */}
          <div className="text-sm text-muted-foreground space-y-1">
            {isDirty && (
              <p>You have unsaved changes</p>
            )}
            {isAutoSaving && (
              <p>Auto-saving...</p>
            )}
            {lastSaved && (
              <p>Last saved: {lastSaved.toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
