'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { NotificationsMenu } from '@/features/collaboration/NotificationsMenu';
import { useWorkspaceSocket } from '@/features/collaboration/useWorkspaceSocket';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import { AppSidebar } from './AppSidebar';
import { WorkspaceCreateDialog } from './WorkspaceCreateDialog';
import { PulseDrawer } from '@/features/assistant/PulseDrawer';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  useWorkspaceSocket(workspace.workspaceId);

  if (workspace.isLoading || !user) {
    return <LoadingState label="Loading workspace" page />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground xl:grid xl:grid-cols-[17rem_1fr]">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreate={() => setCreateOpen(true)}
      />
      <div className="min-w-0 xl:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl lg:px-8">
          <button
            className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="min-w-0 flex-1 [&>span]:block [&>span]:truncate [&>span]:font-heading [&>span]:font-semibold [&>small]:font-mono [&>small]:text-[10px] [&>small]:uppercase [&>small]:tracking-wider [&>small]:text-muted-foreground">
            <span>{workspace.currentWorkspace?.name ?? 'Your workspaces'}</span>
            {workspace.currentWorkspace?.role ? (
              <small>{workspace.currentWorkspace.role}</small>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <PulseDrawer />
            <NotificationsMenu workspaceId={workspace.workspaceId} />
            <UserAvatar name={user.fullName} size="sm" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <WorkspaceCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
};
