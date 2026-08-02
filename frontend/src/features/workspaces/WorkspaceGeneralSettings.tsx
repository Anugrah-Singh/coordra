import { LoadingButton } from '@/components/shared/LoadingButton';
import { Card } from '@/components/ui/card';

export function WorkspaceGeneralSettings({
  name,
  slug,
  currentName,
  canEdit,
  saving,
  onNameChange,
  onSave,
}: {
  name: string;
  slug: string;
  currentName: string;
  canEdit: boolean;
  saving: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
}) {
  return (
    <Card className="gap-5 p-5 shadow-xs [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
      <header>
        <h2>Workspace profile</h2>
        <p>Visible to every active workspace member.</p>
      </header>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Workspace name</span>
          <input
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={name}
            minLength={3}
            maxLength={50}
            disabled={!canEdit}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Workspace slug</span>
          <input
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={slug}
            disabled
          />
          <small className="font-normal text-muted-foreground">
            Slugs remain stable so shared links do not break.
          </small>
        </label>
        {canEdit ? (
          <div className="flex justify-end">
            <LoadingButton
              type="submit"
              disabled={!name.trim() || name === currentName}
              isLoading={saving}
            >
              Save profile
            </LoadingButton>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
