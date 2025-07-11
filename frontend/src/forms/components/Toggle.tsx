import React from 'react';

interface ToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1">
        <label htmlFor={id} className={`block text-sm font-medium ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </label>
        {description && (
          <p className={`text-sm text-muted-foreground ${disabled ? 'opacity-50' : ''}`}>
            {description}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 
          focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ml-4
          ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default Toggle;
