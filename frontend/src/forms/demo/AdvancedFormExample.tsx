import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormSubmit,
  EnhancedFormField,
  PasswordStrength,
  ValidationSummary
} from '../components';
import {
  useAdvancedValidation,
  useEnhancedAutoSave,
  advancedValidationSchemas,
  commonCrossFieldRules,
  commonConditionalFields
} from '../hooks';

// Advanced user registration schema
const registrationSchema = z.object({
  email: advancedValidationSchemas.businessEmail,
  password: advancedValidationSchemas.strongPassword,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  role: z.string().optional(),
  newsletter: z.boolean(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
  // Conditional fields
  companySize: z.string().optional(),
  industry: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const AdvancedFormExample: React.FC = () => {
  const methods = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      company: undefined,
      role: undefined,
      newsletter: false,
      termsAccepted: false,
      companySize: undefined,
      industry: undefined,
    } satisfies RegistrationFormData,
    mode: 'onChange' // Enable real-time validation
  });

  const { watch } = methods;
  const formValues = watch();

  // Advanced validation with cross-field rules and conditional fields
  const {
    isValidating,
    fieldErrors,
    isFieldVisible,
    isFieldRequired,
    validateAllFields
  } = useAdvancedValidation(methods, {
    crossFieldRules: [
      commonCrossFieldRules.confirmPassword('password', 'confirmPassword'),
      commonCrossFieldRules.conditionalRequired(
        'companySize',
        (values) => Boolean(values.company),
        'Company size is required when company is provided'
      ),
      commonCrossFieldRules.conditionalRequired(
        'industry',
        (values) => Boolean(values.company),
        'Industry is required when company is provided'
      )
    ],
    conditionalFields: [
      commonConditionalFields.showWhenNotEmpty('company', 'companySize'),
      commonConditionalFields.showWhenNotEmpty('company', 'industry'),
    ],
    realTimeValidation: true,
    debounceMs: 500
  });

  // Enhanced auto-save functionality
  const autoSaveState = useEnhancedAutoSave(methods, {
    storageKey: 'registration-form-draft',
    interval: 15000, // Auto-save every 15 seconds
    onAutoSave: async (data) => {
      // Here you could save to your backend
      console.log('Auto-saving registration data:', data);
    },
    excludeFields: ['password', 'confirmPassword'], // Don't save sensitive data
    onlyWhenValid: false, // Save drafts even if invalid
    debounceMs: 2000
  });

  const onSubmit = async (data: RegistrationFormData) => {
    const isValid = await validateAllFields();
    if (!isValid) return;

    try {
      console.log('Submitting registration:', data);
      // Clear auto-saved data on successful submission
      autoSaveState.clearStorage();
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Advanced Form Validation Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Showcasing real-time validation, cross-field validation, conditional fields, and auto-save
        </p>
      </div>

      {/* Auto-save status */}
      {autoSaveState.isAutoSaveEnabled && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <div>
              {autoSaveState.isSaving && (
                <span className="text-blue-600">💾 Auto-saving...</span>
              )}
              {autoSaveState.lastSaved && !autoSaveState.isSaving && (
                <span className="text-green-600">
                  ✅ Last saved: {autoSaveState.lastSaved.toLocaleTimeString()}
                </span>
              )}
              {autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving && (
                <span className="text-yellow-600">⚠️ Unsaved changes</span>
              )}
            </div>
            <button
              type="button"
              onClick={autoSaveState.saveNow}
              className="text-blue-600 hover:text-blue-800"
            >
              Save Now
            </button>
          </div>
        </div>
      )}

      <FormProvider {...methods}>
        <Form form={methods} onSubmit={onSubmit} className="space-y-6">
          {/* Validation Summary */}
          <ValidationSummary errors={fieldErrors} />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedFormField
                name="firstName"
                label="First Name"
                required
                hint="Enter your legal first name"
              >
                {({ value, onChange, onBlur, name, error }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    name={name}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="John"
                  />
                )}
              </EnhancedFormField>

              <EnhancedFormField
                name="lastName"
                label="Last Name"
                required
                hint="Enter your legal last name"
              >
                {({ value, onChange, onBlur, name, error }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    name={name}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Doe"
                  />
                )}
              </EnhancedFormField>
            </div>

            <EnhancedFormField
              name="email"
              label="Email Address"
              required
              hint="Please use your business email address"
            >
              {({ value, onChange, onBlur, name, error }) => (
                <input
                  type="email"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="john@company.com"
                />
              )}
            </EnhancedFormField>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Security
            </h3>

            <EnhancedFormField
              name="password"
              label="Password"
              required
              hint="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            >
              {({ value, onChange, onBlur, name, error }) => (
                <div>
                  <input
                    type="password"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    name={name}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter a strong password"
                  />
                  <PasswordStrength password={value} />
                </div>
              )}
            </EnhancedFormField>

            <EnhancedFormField
              name="confirmPassword"
              label="Confirm Password"
              required
              hint="Re-enter your password to confirm"
            >
              {({ value, onChange, onBlur, name, error }) => (
                <input
                  type="password"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Confirm your password"
                />
              )}
            </EnhancedFormField>
          </div>

          {/* Company Information (Conditional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Company Information (Optional)
            </h3>

            <EnhancedFormField
              name="company"
              label="Company Name"
              hint="Enter your company name to show additional fields"
            >
              {({ value, onChange, onBlur, name }) => (
                <input
                  type="text"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Your Company Inc."
                />
              )}
            </EnhancedFormField>

            {/* Conditional fields - only show when company is provided */}
            {isFieldVisible('companySize') && (
              <EnhancedFormField
                name="companySize"
                label="Company Size"
                required={isFieldRequired('companySize')}
                hint="How many employees does your company have?"
              >
                {({ value, onChange, onBlur, name, error }) => (
                  <select
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    name={name}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                )}
              </EnhancedFormField>
            )}

            {isFieldVisible('industry') && (
              <EnhancedFormField
                name="industry"
                label="Industry"
                required={isFieldRequired('industry')}
                hint="What industry is your company in?"
              >
                {({ value, onChange, onBlur, name, error }) => (
                  <select
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    name={name}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </EnhancedFormField>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Preferences
            </h3>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formValues.newsletter}
                onChange={(e) => methods.setValue('newsletter', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Subscribe to newsletter for updates and tips
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formValues.termsAccepted}
                onChange={(e) => methods.setValue('termsAccepted', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I accept the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </a>
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <FormSubmit
              disabled={isValidating}
              className="w-full"
            >
              {isValidating ? 'Validating...' : 'Create Account'}
            </FormSubmit>
          </div>
        </Form>
      </FormProvider>

      {/* Debug Information */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Debug Information</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>Validating: {isValidating ? 'Yes' : 'No'}</div>
          <div>Field Errors: {Object.keys(fieldErrors).length}</div>
          <div>Conditional Fields Visible: {Object.values(formValues).filter(v => isFieldVisible(String(v))).length}</div>
          <div>Auto-save Enabled: {autoSaveState.isAutoSaveEnabled ? 'Yes' : 'No'}</div>
          <div>Has Unsaved Changes: {autoSaveState.hasUnsavedChanges ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFormExample;
