import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PulseMessageItem } from './usePulse';

export const PulseMessage = ({
  message,
  onRetry,
  children,
}: {
  message: PulseMessageItem;
  onRetry: (prompt: string) => void;
  children?: React.ReactNode;
}) => (
  <li
    className={
      message.role === 'user'
        ? 'ml-10 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground'
        : 'mr-6 rounded-2xl rounded-bl-md border bg-card px-4 py-3 text-sm shadow-sm'
    }
  >
    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
    {message.activities?.length ? (
      <ul className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">
        {message.activities.map((activity) => (
          <li className="flex items-center gap-1.5" key={activity}>
            <CheckCircle2 aria-hidden="true" size={13} /> {activity}
          </li>
        ))}
      </ul>
    ) : null}
    {children}
    {message.failedPrompt ? (
      <Button
        className="mt-3"
        size="sm"
        variant="outline"
        type="button"
        onClick={() => onRetry(message.failedPrompt!)}
      >
        <RotateCcw aria-hidden="true" /> Retry
      </Button>
    ) : null}
  </li>
);
