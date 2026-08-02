import { ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WorkspaceDangerSettings({ onDelete }: { onDelete: () => void }) {
  return (
    <Card className="flex flex-col gap-4 border-destructive/35 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <ShieldAlert size={22} />
        <div>
          <h2 className="font-heading font-semibold">Danger zone</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Deleting a workspace permanently removes its projects, tasks, comments,
            labels, memberships, notifications, invitations, and audit records.
          </p>
        </div>
      </div>
      <Button variant="destructive" onClick={onDelete}>
        <Trash2 size={16} /> Delete workspace
      </Button>
    </Card>
  );
}
