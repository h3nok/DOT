import React from 'react';
import { Controller } from 'react-hook-form';
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
import { cn } from '../../../lib/utils';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumSwitch,
  PremiumDropdown
} from '../../../shared/components/ui/design-system-primitives';

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
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col pb-20">
      {/* Ambient Gradient Glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90 z-0 pointer-events-none" />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/10 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 overflow-hidden z-10">
        {/* Procedural Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-40" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl relative group overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <Settings className="w-8 h-8 text-primary relative z-10 animate-[spin_20s_linear_infinite]" />
              </div>
              <div>
                <PremiumTitle tag="h1" variant="gradient" className="tracking-widest">Platform Settings</PremiumTitle>
                <PremiumText variant="vibrant" size="base" className="opacity-80 mt-1">
                  Tune, configure, and calibrate your local DOT experience
                </PremiumText>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <HighContrastBadge glowColor="secondary" pulse>
                COGNITIVE ENGINE LINKED
              </HighContrastBadge>
              <HighContrastBadge glowColor="accent">
                NODE STATUS: SYNCD
              </HighContrastBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Theme & Appearance */}
          <PremiumGlassCard enable3D={true}>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border/10 pb-4">
                <Palette className="w-5 h-5 text-primary" />
                <PremiumTitle tag="h3" variant="solid">Theme & Appearance</PremiumTitle>
              </div>

              <div className="space-y-4">
                <PremiumText variant="vibrant" weight="medium" size="base">Current Theme Configuration</PremiumText>
                <div className="flex items-center space-x-4 p-4 bg-white/[0.02] dark:bg-black/40 border border-border/10 rounded-xl relative overflow-hidden group/item">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                  <span className="text-3xl relative z-10">{currentTheme?.icon}</span>
                  <div className="relative z-10 flex-1">
                    <PremiumText variant="contrast" size="base">{currentTheme?.name}</PremiumText>
                    <PremiumText variant="body" size="sm" className="opacity-80">{currentTheme?.description}</PremiumText>
                  </div>
                  <HighContrastBadge glowColor="primary" className="relative z-10">
                    {currentTheme?.category}
                  </HighContrastBadge>
                </div>
              </div>

              <div className="h-[1px] bg-border/10 w-full" />

              <div className="space-y-4">
                <PremiumText variant="vibrant" weight="medium" size="base">Theme Selection Matrix</PremiumText>
                <div className="space-y-4">
                  <ModernThemeToggle />
                  <PremiumText variant="body" size="sm" className="opacity-75">
                    Select a dynamic spectral envelope optimized for high cognitive retention, long-duration reading, and biometric calmness.
                  </PremiumText>
                </div>
              </div>
            </div>
          </PremiumGlassCard>

          {/* Reading Preferences */}
          <PremiumGlassCard enable3D={true}>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border/10 pb-4">
                <BookOpen className="w-5 h-5 text-secondary" />
                <PremiumTitle tag="h3" variant="solid">Reading Preferences</PremiumTitle>
              </div>

              <PremiumSwitch
                label="Auto-optimize for reading"
                badge="Automatically apply reading optimizations like improved line spacing and typography"
                checked={settings.reading?.autoOptimize || false}
                onChange={(checked) =>
                  form.setValue('reading.autoOptimize', checked, { shouldDirty: true })
                }
                glowColor="var(--secondary)"
              />

              <div className="h-[1px] bg-border/10 w-full" />

              <div className="grid md:grid-cols-3 gap-6">
                <Controller
                  name="reading.fontSize"
                  control={form.control}
                  render={({ field }) => (
                    <PremiumDropdown
                      label="Font Size"
                      options={[
                        { value: 'small', label: 'Small Capsule' },
                        { value: 'medium', label: 'Medium Standard' },
                        { value: 'large', label: 'Large Expanded' },
                        { value: 'extra-large', label: 'Max Sovereign' }
                      ]}
                      value={field.value || ''}
                      onChange={(val) => form.setValue('reading.fontSize', val as 'small' | 'medium' | 'large' | 'extra-large', { shouldDirty: true })}
                      glowColor="var(--secondary)"
                    />
                  )}
                />

                <Controller
                  name="reading.lineHeight"
                  control={form.control}
                  render={({ field }) => (
                    <PremiumDropdown
                      label="Line Height"
                      options={[
                        { value: 'compact', label: 'Compact Mesh' },
                        { value: 'comfortable', label: 'Comfortable Standard' },
                        { value: 'relaxed', label: 'Relaxed Orbit' }
                      ]}
                      value={field.value || ''}
                      onChange={(val) => form.setValue('reading.lineHeight', val as 'compact' | 'comfortable' | 'relaxed', { shouldDirty: true })}
                      glowColor="var(--secondary)"
                    />
                  )}
                />

                <Controller
                  name="reading.wordSpacing"
                  control={form.control}
                  render={({ field }) => (
                    <PremiumDropdown
                      label="Word Spacing"
                      options={[
                        { value: 'tight', label: 'Tight Tunnel' },
                        { value: 'normal', label: 'Normal Standard' },
                        { value: 'loose', label: 'Loose Space' }
                      ]}
                      value={field.value || ''}
                      onChange={(val) => form.setValue('reading.wordSpacing', val as 'tight' | 'normal' | 'loose', { shouldDirty: true })}
                      glowColor="var(--secondary)"
                    />
                  )}
                />
              </div>
            </div>
          </PremiumGlassCard>

          {/* Notifications */}
          <PremiumGlassCard enable3D={true}>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border/10 pb-4">
                <Bell className="w-5 h-5 text-accent" />
                <PremiumTitle tag="h3" variant="solid">Telemetry Notifications</PremiumTitle>
              </div>

              <div className="space-y-6">
                {Object.entries({
                  email: ['Email notifications', 'Direct telemetry reports sent to inbox'],
                  push: ['Push notifications', 'Instant system alerts on active node status'],
                  marketing: ['Marketing communications', 'Occasional platform updates & release logs'],
                  newArticles: ['New articles and content', 'Get notified when fresh reading material is ingested'],
                  communityUpdates: ['Community updates', 'Stay linked with adjacent community meshes']
                }).map(([key, [label, desc]]) => (
                  <PremiumSwitch
                    key={key}
                    label={label}
                    badge={desc}
                    checked={settings.notifications?.[key as keyof typeof settings.notifications] || false}
                    onChange={(checked) =>
                      form.setValue(`notifications.${key}` as any, checked, { shouldDirty: true })
                    }
                    glowColor="var(--accent)"
                  />
                ))}
              </div>
            </div>
          </PremiumGlassCard>

          {/* Privacy & Security */}
          <PremiumGlassCard enable3D={true}>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border/10 pb-4">
                <Shield className="w-5 h-5 text-emerald-500" />
                <PremiumTitle tag="h3" variant="solid">Privacy & Security Vault</PremiumTitle>
              </div>

              <Controller
                name="privacy.profileVisibility"
                control={form.control}
                render={({ field }) => (
                  <PremiumDropdown
                    label="Profile Visibility"
                    options={[
                      { value: 'public', label: 'Public - Open Mesh' },
                      { value: 'community', label: 'Community - Verified Mesh Only' },
                      { value: 'private', label: 'Private - Closed Off-line Vault' }
                    ]}
                    value={field.value || ''}
                    onChange={(val) => form.setValue('privacy.profileVisibility', val as 'public' | 'community' | 'private', { shouldDirty: true })}
                    glowColor="#10b981"
                  />
                )}
              />

              <div className="h-[1px] bg-border/10 w-full" />

              <div className="space-y-6">
                <PremiumSwitch
                  label="Activity tracking"
                  badge="Allow local tracking of reading progress and learning analytics"
                  checked={settings.privacy?.activityTracking || false}
                  onChange={(checked) =>
                    form.setValue('privacy.activityTracking', checked, { shouldDirty: true })
                  }
                  glowColor="#10b981"
                />

                <PremiumSwitch
                  label="Enhanced data collection"
                  badge="Help improve the platform with anonymous usage data"
                  checked={settings.privacy?.dataCollection || false}
                  onChange={(checked) =>
                    form.setValue('privacy.dataCollection', checked, { shouldDirty: true })
                  }
                  glowColor="#10b981"
                />
              </div>
            </div>
          </PremiumGlassCard>

          {/* Accessibility */}
          <PremiumGlassCard enable3D={true}>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border/10 pb-4">
                <Eye className="w-5 h-5 text-blue-400" />
                <PremiumTitle tag="h3" variant="solid">Accessibility Controls</PremiumTitle>
              </div>

              <div className="space-y-6">
                <PremiumSwitch
                  label="Reduce motion"
                  badge="Minimize keyframe translations and disable complex graphic debris"
                  checked={settings.accessibility?.reduceMotion || false}
                  onChange={(checked) =>
                    form.setValue('accessibility.reduceMotion', checked, { shouldDirty: true })
                  }
                  glowColor="#818cf8"
                />

                <PremiumSwitch
                  label="High contrast mode"
                  badge="Inforce peak-contrast ratios and maximize neon line-art separation"
                  checked={settings.accessibility?.highContrast || false}
                  onChange={(checked) =>
                    form.setValue('accessibility.highContrast', checked, { shouldDirty: true })
                  }
                  glowColor="#818cf8"
                />

                <PremiumSwitch
                  label="Enhanced keyboard navigation"
                  badge="Enable terminal-style shortcut binds and tab-focus ring notches"
                  checked={settings.accessibility?.keyboardNavigation || false}
                  onChange={(checked) =>
                    form.setValue('accessibility.keyboardNavigation', checked, { shouldDirty: true })
                  }
                  glowColor="#818cf8"
                />
              </div>
            </div>
          </PremiumGlassCard>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <PremiumButton
              onClick={handleSave}
              variant="primary"
              glow
              className="flex-1"
              disabled={!isDirty || isLoading}
              icon={<Save className="w-4 h-4" />}
              data-save-button
            >
              {saveStatus === 'saving' ? 'Ingesting telemetry...' :
               saveStatus === 'saved' ? 'Sync Established!' :
               saveStatus === 'error' ? 'Sync Refused!' :
               'Commit Settings'}
            </PremiumButton>
            <PremiumButton
              variant="outline"
              onClick={handleReset}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Flush to Defaults
            </PremiumButton>
          </div>

          {/* Status indicators */}
          <div className="text-xs font-mono text-muted-foreground bg-white/[0.01] dark:bg-black/20 border border-border/10 rounded-xl p-4 space-y-2 relative overflow-hidden group">
            <div className="absolute inset-y-0 left-0 w-[2px] bg-primary/40" />
            <div className="flex items-center justify-between">
              <span className="opacity-60 uppercase tracking-widest text-[9.5px]">SAVE STATUS METRIC</span>
              <span className={cn(
                "font-bold uppercase text-[9.5px]",
                isDirty ? "text-amber-400 animate-pulse" : "text-emerald-500"
              )}>
                {isDirty ? "[ UNSAVED CHANGES ]" : "[ STABLE SYNC ]"}
              </span>
            </div>

            {isAutoSaving && (
              <div className="flex items-center gap-2 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span className="uppercase text-[9.5px] font-semibold tracking-wider">AUTO-SAVING STREAMING ENGAGED...</span>
              </div>
            )}

            {lastSaved && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="opacity-50">LAST SECURE COMMIT TIME:</span>
                <span className="text-foreground/90 font-bold">{lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
