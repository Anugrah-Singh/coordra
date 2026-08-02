import { request } from '@/lib/api-client';
import type { PulseHistoryMessage, PulseProposal, PulseResponse } from '@/types/api';

const path = (workspaceId: string) => `/api/workspaces/${workspaceId}/assistant`;

export const assistantKeys = {
  status: (workspaceId: string) => ['assistant', 'status', workspaceId] as const,
};

export const assistantApi = {
  status: (workspaceId: string) =>
    request<{ enabled: boolean }>({
      method: 'GET',
      url: `${path(workspaceId)}/status`,
    }),
  message: (
    workspaceId: string,
    input: {
      message: string;
      projectId?: string;
      timeZone: string;
      history: PulseHistoryMessage[];
    }
  ) =>
    request<PulseResponse>({
      method: 'POST',
      url: `${path(workspaceId)}/messages`,
      data: input,
      timeoutMs: 35_000,
    }),
  editProposal: (
    workspaceId: string,
    proposalId: string,
    changes: Record<string, unknown>
  ) =>
    request<PulseProposal>({
      method: 'PATCH',
      url: `${path(workspaceId)}/proposals/${proposalId}`,
      data: changes,
    }),
  rejectProposal: (workspaceId: string, proposalId: string) =>
    request<PulseProposal>({
      method: 'POST',
      url: `${path(workspaceId)}/proposals/${proposalId}/reject`,
    }),
  approveProposal: (workspaceId: string, proposalId: string) =>
    request<{ proposal: PulseProposal; resource: unknown }>({
      method: 'POST',
      url: `${path(workspaceId)}/proposals/${proposalId}/approve`,
    }),
};
