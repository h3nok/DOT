import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export interface FieldValidationProps {
  error?: string;
  isValidating?: boolean;
  isValid?: boolean;
  showSuccess?: boolean;
  hint?: string;
  className?: string;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  error,
  isValidating,
  isValid,
  showSuccess = true,
  hint,
  className = ''
}) => {
  const hasError = Boolean(error);
  const showSuccessIcon = showSuccess && isValid && !hasError && !isValidating;

  return (
    <div className={`mt-1 min-h-[20px] ${className}`}>
      <AnimatePresence mode="wait">
        {isValidating && (
          <motion.div
            key="validating"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center text-sm text-blue-600"
          >
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Validating...
          </motion.div>
        )}
        
        {hasError && !isValidating && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center text-sm text-red-600"
          >
            <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            {error}
          </motion.div>
        )}
        
        {showSuccessIcon && !isValidating && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center text-sm text-green-600"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Looks good!
          </motion.div>
        )}
        
        {hint && !hasError && !isValidating && !showSuccessIcon && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-gray-500"
          >
            {hint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  className = ''
}) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  if (!password) return null;

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex space-x-1 mb-2">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              index < strength ? strengthColors[strength - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength < 2 ? 'text-red-600' :
        strength < 4 ? 'text-yellow-600' :
        'text-green-600'
      }`}>
        Password strength: {strengthLabels[strength - 1] || 'Very Weak'}
      </p>
    </div>
  );
};

export interface ValidationSummaryProps {
  errors: Record<string, string>;
  warnings?: Record<string, string>;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  warnings = {},
  className = ''
}) => {
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;

  if (errorCount === 0 && warningCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`rounded-md border p-4 ${className}`}
    >
      {errorCount > 0 && (
        <div className="mb-4">
          <h4 className="flex items-center text-sm font-medium text-red-800 mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errorCount} error{errorCount !== 1 ? 's' : ''} found
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {warningCount > 0 && (
        <div>
          <h4 className="flex items-center text-sm font-medium text-yellow-800 mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {Object.entries(warnings).map(([field, warning]) => (
              <li key={field}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};
