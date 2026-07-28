'use client';

import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'variant'> & {
  isLoading?: boolean;
  variant?: ComponentProps<typeof Button>['variant'] | 'danger';
};

export function LoadingButton({
  isLoading = false,
  disabled,
  variant,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      variant={variant === 'danger' ? 'destructive' : variant}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle data-icon="inline-start" className="animate-spin" />
      ) : null}
      {children}
    </Button>
  );
}
