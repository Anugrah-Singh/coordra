import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function LoadingState({
  label = 'Loading',
  page = false,
}: {
  label?: string;
  page?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground',
        page && 'min-h-[50vh]'
      )}
      role="status"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
