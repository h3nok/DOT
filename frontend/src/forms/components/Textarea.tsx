import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '../../shared/components/ui/label';

interface TextareaProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
  error?: string;
}

export function Textarea<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  error
}: TextareaProps<TFieldValues>) {
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
          <textarea
            {...field}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`
              w-full px-3 py-2 border border-border rounded-md 
              bg-background text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-none
              ${error ? 'border-destructive' : ''}
              ${name === 'content' ? 'font-mono text-sm' : ''}
            `}
          />
        )}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export default Textarea;
