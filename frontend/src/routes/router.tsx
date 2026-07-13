import { type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { AuditLogPage } from '../pages/AuditLogPage';
import { InvitePage } from '../pages/InvitePage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { MembersPage } from '../pages/MembersPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProjectBoardPage } from '../pages/ProjectBoardPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { RegisterPage } from '../pages/RegisterPage';
import { SettingsPage } from '../pages/SettingsPage';
import { WorkspaceDashboardPage } from '../pages/WorkspaceDashboardPage';
import { WorkspaceListPage } from '../pages/WorkspaceListPage';

const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner label="Restoring your session" />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children ?? <Outlet />;
};

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSpinner label="Checking your session" />;
  if (user) return <Navigate to="/app" replace />;
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>,
  },
  {
    path: '/register',
    element: <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>,
  },
  {
    path: '/invite/:token',
    element: <ProtectedRoute><InvitePage /></ProtectedRoute>,
  },
  {
    path: '/app',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <WorkspaceListPage /> },
      { path: 'workspaces/:workspaceId', element: <WorkspaceDashboardPage /> },
      { path: 'workspaces/:workspaceId/projects', element: <ProjectsPage /> },
      { path: 'workspaces/:workspaceId/projects/:projectId', element: <ProjectBoardPage /> },
      { path: 'workspaces/:workspaceId/members', element: <MembersPage /> },
      { path: 'workspaces/:workspaceId/activity', element: <AuditLogPage /> },
      { path: 'workspaces/:workspaceId/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
