'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import type { PulseHistoryMessage, PulseProposal } from '@/types/api';
import { assistantApi, assistantKeys } from './assistant.api';

export type PulseMessageItem = PulseHistoryMessage & {
  id: string;
  activities?: string[];
  proposal?: PulseProposal;
  failedPrompt?: string;
};

export const boundHistory = (messages: PulseMessageItem[]) => {
  const bounded: PulseHistoryMessage[] = [];
  let characters = 0;
  for (const message of messages.slice(-10).reverse()) {
    if (characters + message.content.length > 10_000) break;
    bounded.unshift({ role: message.role, content: message.content });
    characters += message.content.length;
  }
  return bounded;
};

export const usePulse = (workspaceId: string, projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<PulseMessageItem[]>([]);

  useEffect(() => setMessages([]), [workspaceId, user?.id]);

  const statusQuery = useQuery({
    queryKey: assistantKeys.status(workspaceId),
    queryFn: () => assistantApi.status(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (message: string) =>
      assistantApi.message(workspaceId, {
        message,
        ...(projectId ? { projectId } : {}),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        history: boundHistory(messages),
      }),
    onMutate: (message) => {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'user', content: message },
      ]);
    },
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.message,
          activities: result.activities,
          proposal: result.proposal,
        },
      ]);
    },
    onError: (error, prompt) => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error.message,
          failedPrompt: prompt,
        },
      ]);
    },
  });

  const invalidateAfterApproval = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(workspaceId),
      }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  };

  return {
    enabled: statusQuery.data?.enabled === true,
    statusLoading: statusQuery.isLoading,
    messages,
    isSending: mutation.isPending,
    send: (message: string) => mutation.mutate(message),
    clear: () => setMessages([]),
    replaceProposal: (proposal: PulseProposal) =>
      setMessages((current) =>
        current.map((message) =>
          message.proposal?.id === proposal.id ? { ...message, proposal } : message
        )
      ),
    invalidateAfterApproval,
  };
};
