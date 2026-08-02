'use client';

import { useMemo } from 'react';
import {
  Activity,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  LogOut,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import { cn } from '@/lib/utils';

function NavLink({
  to,
  end = false,
  children,
  onClick,
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const active = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      href={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function AppSidebar({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  const { user, logout } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const { workspaceId } = workspace;
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
  if (!user) return null;
  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform xl:translate-x-0',
          open && 'translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            className="inline-flex items-center gap-2.5 font-heading text-base font-bold"
            href="/app"
            onClick={onClose}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Layers3 size={20} />
            </span>
            <span>Coordra</span>
          </Link>
          <button
            className="inline-flex size-11 items-center justify-center rounded-lg xl:hidden"
            onClick={onClose}
            type="button"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-2 border-b border-sidebar-border p-4 [&>label]:font-mono [&>label]:text-[10px] [&>label]:uppercase [&>label]:tracking-[.14em]">
          <label>Workspace</label>
          <div className="relative">
            <select
              className="h-9 w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar-accent px-3 pr-8 text-sm"
              value={workspaceId ?? ''}
              onChange={(event) => {
                const id = event.target.value;
                router.push(id ? `/app/workspaces/${id}` : '/app');
                onClose();
              }}
            >
              <option value="">All workspaces</option>
              {workspace.workspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-2.5"
              size={16}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={onCreate}>
            <Plus size={15} /> New workspace
          </Button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {!workspaceId ? (
            <NavLink to="/app" end>
              <LayoutDashboard size={18} /> Workspaces
            </NavLink>
          ) : null}
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              {...(end === undefined ? {} : { end })}
              onClick={onClose}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        {workspaceId && workspace.projects.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/55">
            <span className="mb-2 px-3 font-mono uppercase tracking-[.14em]">
              Recent projects
            </span>
            {workspace.projects.slice(0, 5).map((project) => (
              <NavLink
                key={project.id}
                to={`/app/workspaces/${workspaceId}/projects/${project.id}`}
                onClick={onClose}
              >
                <span className="size-1.5 rounded-full bg-sidebar-primary" />{' '}
                {project.name}
              </NavLink>
            ))}
          </div>
        ) : null}
        <div className="mt-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-sidebar-border p-4">
          <UserAvatar name={user.fullName} />
          <div className="min-w-0">
            <strong className="block truncate text-sm">{user.fullName}</strong>
            <span className="block truncate text-xs">{user.email}</span>
          </div>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center"
            aria-label="Sign out"
            onClick={() => void logout().then(() => router.replace('/login'))}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {open ? (
        <button
          className="fixed inset-0 z-30 bg-foreground/30 xl:hidden"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        />
      ) : null}
    </>
  );
}
