// Contact Form Component for Support Page
// Premium Design System Refactor

import React, { useState } from 'react';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  PremiumButton,
  PremiumInput,
  PremiumTextArea,
  PremiumDropdown
} from '../ui/design-system-primitives';
import { motion } from 'framer-motion';
import {
  Send,
  X,
  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare,
  Clock,
  Upload,
  FileText
} from 'lucide-react';
import SupportService, { ContactForm as ContactFormData } from '../../../services/SupportService';
import ErrorService from '../../../services/errors/ErrorService';
import clsx from 'clsx';

interface ContactFormProps {
  onSubmitSuccess?: (ticketId: string) => void;
  onCancel?: () => void;
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({
  onSubmitSuccess,
  onCancel,
  className
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '',
    urgency: 'medium',
    attachments: [],
  });

  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const categories = [
    'Technical Support',
    'Account Issues',
    'Feature Request',
    'Bug Report',
    'General Question',
    'Billing',
    'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];

    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" has an unsupported format.`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...validFiles]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await SupportService.submitContactForm(formData);
      setTicketId(result.id);
      setIsSuccess(true);
      onSubmitSuccess?.(result.id);
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'ContactForm',
        action: 'submit',
        metadata: { formData: { ...formData, attachments: formData.attachments?.map(f => f.name) } },
      });

      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={clsx("space-y-6 max-w-2xl mx-auto", className)}
      >
        <PremiumGlassCard className="p-8 text-center" glowColor="var(--primary)" enable3D={true}>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-pulse">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>

          <PremiumTitle tag="h2" variant="gradient" className="mb-3 text-center justify-center">
            Payload Committed
          </PremiumTitle>

          <PremiumText variant="vibrant" className="mb-6 max-w-md mx-auto">
            Your support packet has been securely encrypted and dispatched to the Core Synapse.
            A response vector will be computed shortly.
          </PremiumText>

          {ticketId && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground font-mono text-sm">SYNAPSE_ID: {ticketId}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Retain this hexadecimal signature for direct ledger query.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <PremiumText variant="contrast" size="sm">RESPONSE_LATENCY</PremiumText>
                <PremiumText variant="vibrant" size="xs">Computed within &lt; 24h</PremiumText>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <Mail className="w-5 h-5 text-emerald-400" />
              <div>
                <PremiumText variant="contrast" size="sm">PEER_SYNC</PremiumText>
                <PremiumText variant="vibrant" size="xs">Synchronizing to your email</PremiumText>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PremiumButton onClick={onCancel} variant="outline" className="w-full sm:w-auto">
              Return to Hub
            </PremiumButton>
            <PremiumButton
              onClick={() => {
                setIsSuccess(false);
                setFormData({
                  name: '',
                  email: '',
                  subject: '',
                  message: '',
                  category: '',
                  urgency: 'medium',
                  attachments: [],
                });
                setTicketId(null);
              }}
              variant="primary"
              className="w-full sm:w-auto"
            >
              Dispatch New Query
            </PremiumButton>
          </div>
        </PremiumGlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("space-y-6 max-w-3xl mx-auto", className)}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 border border-primary/25 rounded-lg">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <PremiumTitle tag="h2" variant="gradient">
            Initialize Support Synapse
          </PremiumTitle>
        </div>
        <PremiumText variant="vibrant" size="base" className="max-w-2xl mx-auto text-foreground/80">
          Need technical or operational assistance? Open a ticket to interface with our team.
        </PremiumText>
      </div>

      <PremiumGlassCard className="p-6" glowColor="var(--primary)" enable3D={false}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumInput
              id="name"
              label="Operator Name *"
              badge="REQUIRED"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
            />

            <PremiumInput
              id="email"
              type="email"
              label="Sync Email *"
              badge="REQUIRED"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
            />
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <PremiumDropdown
                label="Category *"
                options={categories.map(category => ({
                  value: category,
                  label: category
                }))}
                value={formData.category}
                onChange={(val) => handleInputChange('category', val)}
                glowColor="var(--primary)"
              />
              {errors.category && (
                <span className="text-[9.5px] font-mono font-semibold uppercase tracking-wider text-red-500 flex items-center gap-1 mt-1 px-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.category}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <PremiumDropdown
                label="Urgency Level"
                options={urgencyLevels.map(level => ({
                  value: level.value,
                  label: level.label
                }))}
                value={formData.urgency}
                onChange={(val) => handleInputChange('urgency', val)}
                glowColor="var(--accent)"
              />
            </div>
          </div>

          {/* Subject */}
          <PremiumInput
            id="subject"
            label="Discourse Subject *"
            badge="REQUIRED"
            placeholder="Brief description of your issue"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            error={errors.subject}
          />

          {/* Message */}
          <div>
            <PremiumTextArea
              id="message"
              label="Detailed Description *"
              badge="MIN 10 CHARS"
              placeholder="Please describe your issue or question in detail..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={6}
              error={errors.message}
            />
            <div className="flex justify-end mt-1 px-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                {formData.message.length}/1000 characters
              </span>
            </div>
          </div>

          {/* File Attachments */}
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wider text-foreground/80">
              Payload Attachments (Optional)
            </span>
            <div className="border-2 border-dashed border-white/10 hover:border-primary/40 transition-colors duration-300 rounded-xl p-6 bg-white/[0.01]">
              <div className="text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Drag and drop files here, or click to select files
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <PremiumButton type="button" variant="glass" size="sm">
                    Select Files
                  </PremiumButton>
                </label>
                <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
                  Maximum file size: 5MB. Supported formats: Images, PDF, Text
                </p>
              </div>

              {formData.attachments && formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono font-semibold text-foreground/90">{file.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground/75">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <PremiumButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        icon={<X className="w-3.5 h-3.5 text-sky-500" />}
                        onClick={() => removeAttachment(index)}
                      >
                        {null}
                      </PremiumButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <PremiumButton
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              variant="primary"
              glow
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Committing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Commit Payload
                </>
              )}
            </PremiumButton>
            {onCancel && (
              <PremiumButton
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </PremiumButton>
            )}
          </div>
        </form>
      </PremiumGlassCard>

      {/* Contact Information */}
      <PremiumGlassCard className="p-6" glowColor="var(--secondary)">
        <div className="text-center">
          <PremiumTitle tag="h3" variant="solid" className="mb-4 text-center justify-center">
            ALTERNATIVE LINKS
          </PremiumTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
              <div className="text-left font-mono text-xs">
                <p className="font-extrabold text-foreground">DIRECT_EMAIL</p>
                <p className="text-muted-foreground/90">support@digitalorganism.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <Clock className="w-5 h-5 text-secondary" />
              <div className="text-left font-mono text-xs">
                <p className="font-extrabold text-foreground">SERVICE_UPTIME</p>
                <p className="text-muted-foreground/90">Usually computed &lt; 24h</p>
              </div>
            </div>
          </div>
        </div>
      </PremiumGlassCard>
    </motion.div>
  );
};

export default ContactForm;
