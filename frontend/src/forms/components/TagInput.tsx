import { useState, KeyboardEvent } from 'react';
import { Input } from '../../shared/components/ui/input';
import { Badge } from '../../shared/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  onBlur,
  placeholder = 'Add tags...',
  maxTags = 10,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (
      trimmedValue &&
      !value.includes(trimmedValue) &&
      value.length < maxTags
    ) {
      onChange([...value, trimmedValue]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleInputBlur = () => {
    addTag();
    onBlur?.();
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background min-h-[2.5rem] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="text-xs">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        
        {!disabled && value.length < maxTags && (
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        )}
      </div>
      
      {value.length >= maxTags && (
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}
      
      <p className="text-xs text-muted-foreground mt-1">
        Press Enter or comma to add tags
      </p>
    </div>
  );
}
