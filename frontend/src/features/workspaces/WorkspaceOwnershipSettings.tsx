import { Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WorkspaceOwnershipSettings({
  isOwner,
  onTransfer,
}: {
  isOwner: boolean;
  onTransfer: () => void;
}) {
  return (
    <Card className="gap-5 p-5 shadow-xs [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
      <header>
        <h2>Developer access</h2>
        <p>Inspect the documented API used by this frontend.</p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/35 p-4">
        <div>
          <strong className="block">OpenAPI / Swagger UI</strong>
          <span className="text-sm text-muted-foreground">
            Authentication, request examples, and endpoint groups.
          </span>
        </div>
        <Button asChild size="sm" variant="secondary">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api-docs`}
            target="_blank"
            rel="noreferrer"
          >
            Open docs <ExternalLink size={15} />
          </a>
        </Button>
      </div>
      {isOwner ? (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <Crown size={22} />
          <div>
            <strong>Workspace ownership</strong>
            <span className="block text-sm text-amber-800">
              Transfer the owner role to another active member.
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={onTransfer}>
            Transfer
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
