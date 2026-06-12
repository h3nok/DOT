import React from 'react';
import {
  PremiumGlassCard,
  PremiumButton,
  PremiumInput,
  PremiumTextArea,
  PremiumTitle
} from '../../../../shared/components/ui/design-system-primitives';
import { Save, X } from 'lucide-react';

interface ProfileCredentialsFormProps {
  editForm: {
    username: string;
    email: string;
    bio: string;
    location: string;
    website: string;
  };
  setEditForm: React.Dispatch<React.SetStateAction<{
    username: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    joinDate: string;
    avatar: any;
  }>>;
  onSave: () => void;
  onCancel: () => void;
}

export const ProfileCredentialsForm: React.FC<ProfileCredentialsFormProps> = ({
  editForm,
  setEditForm,
  onSave,
  onCancel,
}) => {
  return (
    <PremiumGlassCard enable3D={false} className="w-full" glowColor="#2563eb">
      <div className="border-b border-sky-500/20 pb-4 mb-6 relative z-10 flex items-center justify-between">
        <PremiumTitle tag="h3" variant="solid" className="text-sky-400">
          Edit Profile Configurations
        </PremiumTitle>
        <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded px-2 py-0.5 uppercase tracking-widest">
          SYSTEM_OVERRIDE
        </span>
      </div>

      <div className="space-y-5 relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PremiumInput
            label="Full Name"
            badge="sys_profile_name"
            value={editForm.username}
            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Enter full name"
          />
          <PremiumInput
            type="email"
            label="System Email"
            badge="sys_profile_email"
            value={editForm.email}
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
          />
        </div>

        <PremiumTextArea
          label="Professional Bio"
          badge="sys_profile_bio"
          value={editForm.bio}
          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
          placeholder="Describe your professional specialization..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PremiumInput
            label="Physical Node Location"
            badge="sys_location"
            value={editForm.location}
            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. Austin, TX"
          />
          <PremiumInput
            label="Network Domain URL"
            badge="sys_domain_url"
            value={editForm.website}
            onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
            placeholder="e.g. stay.co"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <PremiumButton
            variant="primary"
            glow
            onClick={onSave}
            icon={<Save className="w-3.5 h-3.5 text-white" />}
            className="text-xs font-mono uppercase tracking-widest font-bold"
          >
            Save Credentials
          </PremiumButton>
          <PremiumButton
            variant="glass"
            onClick={onCancel}
            icon={<X className="w-3.5 h-3.5 text-foreground/80" />}
            className="text-xs font-mono uppercase tracking-widest font-bold"
          >
            Cancel
          </PremiumButton>
        </div>
      </div>
    </PremiumGlassCard>
  );
};
