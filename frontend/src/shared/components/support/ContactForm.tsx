// Contact Form Component for Support Page
// MVP Implementation - Enhanced Contact System

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import GlassCard from '../ui/glass-card';
import { motion } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  X, 
  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare,
  Clock,
  Upload,
  FileText,
  ChevronDown
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
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={clsx("space-y-6", className)}
      >
        <GlassCard className="p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Message Sent Successfully!
          </h3>
          <p className="text-muted-foreground mb-4">
            Thank you for contacting us. We've received your message and will respond as soon as possible.
          </p>
          
          {ticketId && (
            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Ticket ID: {ticketId}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Save this ticket ID for your records. You can use it to track your support request.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-foreground">Response Time</p>
                <p className="text-sm text-muted-foreground">Usually within 24 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <Mail className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-foreground">Email Updates</p>
                <p className="text-sm text-muted-foreground">We'll email you updates</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={onCancel} variant="default">
              Back to Support
            </Button>
            <Button 
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
              variant="outline"
            >
              Send Another Message
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("space-y-6", className)}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">
            Contact Support
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Need help? Send us a message and we'll get back to you as soon as possible.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={clsx(
                  "w-full px-3 py-2 border rounded-md bg-background text-foreground",
                  errors.category ? 'border-red-500' : 'border-input'
                )}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) => handleInputChange('urgency', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
              >
                {urgencyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.subject}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Please describe your issue or question in detail..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={6}
              className={errors.message ? 'border-red-500' : ''}
            />
            {errors.message && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.message}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.message.length}/1000 characters
            </p>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
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
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Select Files
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: 5MB. Supported formats: Images, PDF, Text
                </p>
              </div>
              
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </GlassCard>

      {/* Contact Information */}
      <GlassCard className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Other Ways to Reach Us
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">support@digitalorganism.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">Response Time</p>
                <p className="text-sm text-muted-foreground">Usually within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ContactForm;
