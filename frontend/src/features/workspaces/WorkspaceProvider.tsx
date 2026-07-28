'use client';

import { createContext, useContext, type PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { projectApi } from '@/features/projects/projects.api';
import { workspaceApi } from '@/features/workspaces/workspaces.api';
import type { Project, Workspace } from '@/types/api';

type WorkspaceValue = {
  workspaceId: string | undefined;
  currentWorkspace: Workspace | undefined;
  workspaces: Workspace[];
  projects: Project[];
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const params = useParams<{ workspaceId?: string }>() ?? {};
  const workspaceId = params.workspaceId;
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.list,
  });
  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectApi.list(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
  });
  const value: WorkspaceValue = {
    workspaceId,
    workspaces: workspacesQuery.data ?? [],
    currentWorkspace: workspacesQuery.data?.find((item) => item.id === workspaceId),
    projects: projectsQuery.data ?? [],
    isLoading: workspacesQuery.isLoading,
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return value;
}
