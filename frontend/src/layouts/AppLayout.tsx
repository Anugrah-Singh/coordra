import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import { projectApi, workspaceApi } from '../api';
import { NotificationsMenu } from '../components/NotificationsMenu';
import { Avatar, Button, Modal, PageSpinner, cn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaceSocket } from '../hooks/useWorkspaceSocket';
import { queryClient } from '../lib/queryClient';

export type AppOutletContext = {
  workspaceId: string | undefined;
  currentWorkspace: ReturnType<typeof useWorkspaceData>['currentWorkspace'];
  workspaces: ReturnType<typeof useWorkspaceData>['workspaces'];
  projects: ReturnType<typeof useWorkspaceData>['projects'];
};

const useWorkspaceData = (workspaceId?: string) => {
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.list,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectApi.list(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
  });

  return {
    workspaces: workspacesQuery.data ?? [],
    currentWorkspace: workspacesQuery.data?.find((item) => item.id === workspaceId),
    projects: projectsQuery.data ?? [],
    isLoading: workspacesQuery.isLoading,
  };
};

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const workspaceData = useWorkspaceData(workspaceId);
  useWorkspaceSocket(workspaceId);

  const createWorkspaceMutation = useMutation({
    mutationFn: () => workspaceApi.create(workspaceName),
    onSuccess: (workspace) => {
      toast.success('Workspace created');
      setCreateOpen(false);
      setWorkspaceName('');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      navigate(`/app/workspaces/${workspace.id}`);
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
    <div className="app-shell">
      <aside className={cn('sidebar', sidebarOpen && 'sidebar--open')}>
        <div className="sidebar__top">
          <Link className="brand brand--sidebar" to="/app" onClick={closeSidebar}>
            <span className="brand__mark"><Layers3 size={20} /></span>
            <span>WorkspaceOS</span>
          </Link>
          <button className="icon-button sidebar__close" onClick={closeSidebar} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="workspace-switcher">
          <label>Workspace</label>
          <div className="workspace-switcher__select-wrap">
            <select
              value={workspaceId ?? ''}
              onChange={(event) => {
                const id = event.target.value;
                navigate(id ? `/app/workspaces/${id}` : '/app');
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

        <nav className="sidebar-nav">
          {!workspaceId ? (
            <NavLink to="/app" end className={({ isActive }) => cn('sidebar-link', isActive && 'sidebar-link--active')}>
              <LayoutDashboard size={18} /> Workspaces
            </NavLink>
          ) : null}
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              {...(end === undefined ? {} : { end })}
              onClick={closeSidebar}
              className={({ isActive }) => cn('sidebar-link', isActive && 'sidebar-link--active')}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        {workspaceId && workspaceData.projects.length > 0 ? (
          <div className="sidebar-projects">
            <span>Recent projects</span>
            {workspaceData.projects.slice(0, 5).map((project) => (
              <NavLink
                key={project.id}
                to={`/app/workspaces/${workspaceId}/projects/${project.id}`}
                onClick={closeSidebar}
                className={({ isActive }) => cn('sidebar-project-link', isActive && 'sidebar-project-link--active')}
              >
                <span className="project-dot" />
                <span>{project.name}</span>
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="sidebar__footer">
          <Avatar name={user.fullName} />
          <div>
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Sign out"
            onClick={() => {
              void logout().then(() => navigate('/login', { replace: true }));
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {sidebarOpen ? <button className="sidebar-overlay" type="button" onClick={closeSidebar} aria-label="Close navigation" /> : null}

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="topbar__context">
            <span>{workspaceData.currentWorkspace ? workspaceData.currentWorkspace.name : 'Your workspaces'}</span>
            {workspaceData.currentWorkspace?.role ? <small>{workspaceData.currentWorkspace.role}</small> : null}
          </div>
          <div className="topbar__actions">
            <NotificationsMenu workspaceId={workspaceId} />
            <Avatar name={user.fullName} size="sm" />
          </div>
        </header>

        <main className="content">
          <Outlet
            context={{
              workspaceId,
              currentWorkspace: workspaceData.currentWorkspace,
              workspaces: workspaceData.workspaces,
              projects: workspaceData.projects,
            } satisfies AppOutletContext}
          />
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
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            createWorkspaceMutation.mutate();
          }}
        >
          <label className="field">
            <span>Workspace name</span>
            <input
              value={workspaceName}
              minLength={3}
              maxLength={50}
              autoFocus
              placeholder="Product engineering"
              onChange={(event) => setWorkspaceName(event.target.value)}
            />
          </label>
          <div className="button-row button-row--end">
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
