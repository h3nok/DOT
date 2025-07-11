import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '../../shared/components/ui/label';

interface Option {
  value: string;
  label: string;
}

interface SelectProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
}

export function Select<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  placeholder = 'Select an option',
  options,
  disabled = false,
  required = false,
  className = '',
  error
}: SelectProps<TFieldValues>) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>
          {label}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-border rounded-md 
              bg-background text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-destructive' : ''}
            `}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export default Select;
