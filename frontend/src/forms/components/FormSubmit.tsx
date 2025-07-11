import { useFormContext } from 'react-hook-form';
import { Button } from '../../shared/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FormSubmitProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loadingText?: string;
  type?: 'submit' | 'button';
}

export function FormSubmit({
  children,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  loadingText = 'Submitting...',
  type = 'submit',
}: FormSubmitProps) {
  const { formState } = useFormContext();
  const { isSubmitting, isValid } = formState;

  const isDisabled = disabled || isSubmitting || !isValid;

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={cn(className)}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
