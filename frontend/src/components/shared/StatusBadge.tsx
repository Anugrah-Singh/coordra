import type { PropsWithChildren } from 'react';
import { Badge } from '@/components/ui/badge';

const toneVariant = {
  neutral: 'secondary',
  success: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
  purple: 'secondary',
} as const;

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: PropsWithChildren<{
  tone?: keyof typeof toneVariant;
  className?: string;
}>) {
  return (
    <Badge variant={toneVariant[tone]} className={className}>
      {children}
    </Badge>
  );
}
