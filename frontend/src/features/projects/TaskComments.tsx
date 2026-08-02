'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { LoadingState } from '@/components/shared/LoadingState';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { commentApi } from './projects.api';
import { formatDateTime } from '@/lib/format';
import type { WorkspaceMember } from '@/types/api';

export function TaskComments({
  workspaceId,
  projectId,
  taskId,
  members,
  canEdit,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  members: WorkspaceMember[];
  canEdit: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const queryKey = ['comments', workspaceId, projectId, taskId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => commentApi.list(workspaceId, projectId, taskId),
  });
  const createMutation = useMutation({
    mutationFn: () => commentApi.create(workspaceId, projectId, taskId, comment.trim()),
    onSuccess: () => {
      setComment('');
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentApi.remove(workspaceId, projectId, taskId, commentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <aside className="flex min-h-0 flex-col rounded-lg border bg-muted/25 [&>header]:flex [&>header]:items-center [&>header]:gap-3 [&>header]:border-b [&>header]:p-4 [&_h3]:font-semibold [&_p]:text-xs [&_p]:text-muted-foreground">
      <header>
        <MessageSquare size={17} />
        <div>
          <h3>Discussion</h3>
          <p>{query.data?.length ?? 0} comments</p>
        </div>
      </header>
      <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto p-4">
        {query.isLoading ? <LoadingState label="Loading comments" /> : null}
        {query.data?.map((item) => {
          const author = members.find((member) => member.userId === item.authorId);
          return (
            <article
              className="grid grid-cols-[auto_1fr] gap-3 [&_p]:mt-1 [&_p]:whitespace-pre-wrap [&_p]:text-sm"
              key={item.id}
            >
              <UserAvatar name={author?.fullName ?? 'Team member'} size="sm" />
              <div>
                <div className="flex flex-wrap items-center gap-2 [&>span]:text-[10px] [&>span]:text-muted-foreground">
                  <strong>{author?.fullName ?? 'Team member'}</strong>
                  <span>{formatDateTime(item.createdAt)}</span>
                  {item.authorId === user?.id ? (
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => deleteMutation.mutate(item.id)}
                      aria-label="Delete comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
                <p>{item.content}</p>
              </div>
            </article>
          );
        })}
        {!query.isLoading && query.data?.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No comments yet. Start the conversation.
          </div>
        ) : null}
      </div>
      {canEdit ? (
        <form
          className="flex flex-col gap-2 border-t p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (comment.trim()) createMutation.mutate();
          }}
        >
          <textarea
            className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            rows={3}
            value={comment}
            placeholder="Write a comment..."
            onChange={(event) => setComment(event.target.value)}
          />
          <LoadingButton
            type="submit"
            size="sm"
            disabled={!comment.trim()}
            isLoading={createMutation.isPending}
          >
            <Send size={15} /> Comment
          </LoadingButton>
        </form>
      ) : null}
    </aside>
  );
}
