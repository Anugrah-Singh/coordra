"use client";

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Activity,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { workspaceApi } from '../api';
import { NotificationsMenu } from '../components/NotificationsMenu';
import { Avatar, Button, Modal, PageSpinner, cn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaceSocket } from '../hooks/useWorkspaceSocket';
import { queryClient } from '../lib/queryClient';
import { useWorkspace } from '../providers/WorkspaceProvider';

const NavLink = ({ to, end = false, className, children, onClick }: {
  to: string;
  end?: boolean;
  className: (state: { isActive: boolean }) => string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const pathname = usePathname() ?? '';
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return <Link href={to} aria-current={isActive ? 'page' : undefined} className={className({ isActive })} onClick={onClick}>{children}</Link>;
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const workspaceData = useWorkspace();
  const { workspaceId } = workspaceData;
  useWorkspaceSocket(workspaceId);

  const createWorkspaceMutation = useMutation({
    mutationFn: () => workspaceApi.create(workspaceName),
    onSuccess: (workspace) => {
      toast.success('Workspace created');
      setCreateOpen(false);
      setWorkspaceName('');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.push(`/app/workspaces/${workspace.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const navItems = useMemo(
    () =>
      workspaceId
        ? [
            {
              to: `/app/workspaces/${workspaceId}`,
              label: 'Overview',
              icon: LayoutDashboard,
              end: true,
            },
            {
              to: `/app/workspaces/${workspaceId}/projects`,
              label: 'Projects',
              icon: FolderKanban,
            },
            {
              to: `/app/workspaces/${workspaceId}/members`,
              label: 'Members',
              icon: Users,
            },
            {
              to: `/app/workspaces/${workspaceId}/activity`,
              label: 'Audit activity',
              icon: Activity,
            },
            {
              to: `/app/workspaces/${workspaceId}/settings`,
              label: 'Settings',
              icon: Settings,
            },
          ]
        : [],
    [workspaceId]
  );

  if (workspaceData.isLoading || !user) {
    return <PageSpinner />;
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground xl:grid xl:grid-cols-[17rem_1fr]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform xl:translate-x-0', sidebarOpen && 'translate-x-0')}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link className="inline-flex items-center gap-2.5 font-heading text-base font-bold tracking-tight text-sidebar-foreground" href="/app" onClick={closeSidebar}>
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Layers3 size={20} /></span>
            <span>WorkspaceOS</span>
          </Link>
          <button className="inline-flex size-11 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground xl:hidden" onClick={closeSidebar} type="button" aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 border-b border-sidebar-border p-4 [&>label]:font-mono [&>label]:text-[10px] [&>label]:uppercase [&>label]:tracking-[.14em] [&>label]:text-sidebar-foreground/50">
          <label>Workspace</label>
          <div className="relative [&>select]:h-9 [&>select]:w-full [&>select]:appearance-none [&>select]:rounded-lg [&>select]:border [&>select]:border-sidebar-border [&>select]:bg-sidebar-accent [&>select]:px-3 [&>select]:pr-8 [&>select]:text-sm [&>svg]:pointer-events-none [&>svg]:absolute [&>svg]:right-3 [&>svg]:top-2.5">
            <select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              value={workspaceId ?? ''}
              onChange={(event) => {
                const id = event.target.value;
                router.push(id ? `/app/workspaces/${id}` : '/app');
                closeSidebar();
              }}
            >
              <option value="">All workspaces</option>
              {workspaceData.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> New workspace
          </Button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {!workspaceId ? (
            <NavLink to="/app" end className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', isActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm')}>
              <LayoutDashboard size={18} /> Workspaces
            </NavLink>
          ) : null}
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              {...(end === undefined ? {} : { end })}
              onClick={closeSidebar}
              className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', isActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm')}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        {workspaceId && workspaceData.projects.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/55 [&>span]:mb-2 [&>span]:px-3 [&>span]:font-mono [&>span]:uppercase [&>span]:tracking-[.14em]">
            <span>Recent projects</span>
            {workspaceData.projects.slice(0, 5).map((project) => (
              <NavLink
                key={project.id}
                to={`/app/workspaces/${workspaceId}/projects/${project.id}`}
                onClick={closeSidebar}
                className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', isActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
              >
                <span className="size-1.5 rounded-full bg-sidebar-primary" />
                <span>{project.name}</span>
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="mt-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-sidebar-border p-4 [&>div]:min-w-0 [&_strong]:block [&_strong]:truncate [&_strong]:text-sm [&_span]:block [&_span]:truncate [&_span]:text-xs [&_span]:text-sidebar-foreground/55">
          <Avatar name={user.fullName} />
          <div>
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
          </div>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label="Sign out"
            onClick={() => {
              void logout().then(() => router.replace('/login'));
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-foreground/30 xl:hidden" type="button" onClick={closeSidebar} aria-label="Close navigation" /> : null}

      <div className="min-w-0 xl:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl lg:px-8">
          <button className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={21} />
          </button>
          <div className="min-w-0 flex-1 [&>span]:block [&>span]:truncate [&>span]:font-heading [&>span]:font-semibold [&>small]:font-mono [&>small]:text-[10px] [&>small]:uppercase [&>small]:tracking-wider [&>small]:text-muted-foreground">
            <span>{workspaceData.currentWorkspace ? workspaceData.currentWorkspace.name : 'Your workspaces'}</span>
            {workspaceData.currentWorkspace?.role ? <small>{workspaceData.currentWorkspace.role}</small> : null}
          </div>
          <div className="flex items-center gap-2">
            <NotificationsMenu workspaceId={workspaceId} />
            <Avatar name={user.fullName} size="sm" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a workspace"
        description="A workspace keeps projects, members, roles, and activity isolated."
        size="sm"
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            createWorkspaceMutation.mutate();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Workspace name</span>
            <input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              value={workspaceName}
              minLength={3}
              maxLength={50}
              autoFocus
              placeholder="Product engineering"
              onChange={(event) => setWorkspaceName(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createWorkspaceMutation.isPending} disabled={workspaceName.trim().length < 3}>
              Create workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
