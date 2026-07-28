import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function UserAvatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Avatar
      className={cn(size === 'sm' && 'size-7', size === 'lg' && 'size-11')}
      title={name}
    >
      <AvatarFallback>{initials(name) || '?'}</AvatarFallback>
    </Avatar>
  );
}
