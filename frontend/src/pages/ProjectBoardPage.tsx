import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Archive, Filter, Plus, Settings2, Tag } from 'lucide-react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { labelApi, memberApi, projectApi, taskApi } from '../api';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { Button, Card, Modal, Spinner } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { queryClient } from '../lib/queryClient';
import type { Task, TaskFilters, TaskPriority, TaskStatus } from '../types/api';

export const ProjectBoardPage = () => {
  const { workspaceId = '', currentWorkspace } = useOutletContext<AppOutletContext>();
  const { projectId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#6d5dfc');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const canEdit = currentWorkspace?.role !== 'VIEWER';

  const filters = useMemo<TaskFilters>(
    () => ({
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(includeArchived ? { includeArchived: true } : {}),
    }),
    [assigneeId, includeArchived, priority]
  );

  const projectQuery = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => projectApi.get(workspaceId, projectId),
  });

  const tasksKey = ['tasks', workspaceId, projectId, filters] as const;
  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: () => taskApi.list(workspaceId, projectId, filters),
  });

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
  });

  const labelsQuery = useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: () => labelApi.list(workspaceId),
  });

  useEffect(() => {
    const taskId = searchParams.get('task');
    const match = tasksQuery.data?.find((task) => task.id === taskId);
    if (match) setSelectedTask(match);
  }, [searchParams, tasksQuery.data]);

  const statusMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      taskApi.updateStatus(workspaceId, projectId, task.id, status),
    onMutate: async ({ task, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', workspaceId, projectId] });
      const snapshots = queryClient.getQueriesData<Task[]>({ queryKey: ['tasks', workspaceId, projectId] });
      snapshots.forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData<Task[]>(key, data.map((item) => item.id === task.id ? { ...item, status } : item));
        }
      });
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-tasks', workspaceId] });
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: () => labelApi.create(workspaceId, { name: labelName, color: labelColor }),
    onSuccess: () => {
      toast.success('Label created');
      setLabelName('');
      setLabelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const closeTaskModal = () => {
    setSelectedTask(undefined);
    setCreateOpen(false);
    if (searchParams.has('task')) {
      const next = new URLSearchParams(searchParams);
      next.delete('task');
      setSearchParams(next, { replace: true });
    }
  };

  if (projectQuery.isLoading || tasksQuery.isLoading || membersQuery.isLoading) {
    return <Spinner label="Loading project board" />;
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <div>
          <span className="eyebrow">Project board</span>
          <h1>{projectQuery.data?.name}</h1>
          <p>{projectQuery.data?.description || 'Plan, assign, and move delivery work in real time.'}</p>
        </div>
        <div className="board-header__actions">
          {canEdit ? <Button variant="secondary" onClick={() => setLabelOpen(true)}><Tag size={16} /> New label</Button> : null}
          {canEdit ? <Button onClick={() => setCreateOpen(true)}><Plus size={17} /> Create task</Button> : null}
        </div>
      </header>

      <Card className="board-toolbar">
        <div className="board-toolbar__title"><Filter size={16} /><span>Board filters</span></div>
        <label className="compact-field">
          <span>Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | '')}>
            <option value="">All priorities</option>
            <option value="URGENT">Urgent</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
          </select>
        </label>
        <label className="compact-field">
          <span>Assignee</span>
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">Everyone</option>
            {membersQuery.data?.map((member) => <option key={member.userId} value={member.userId}>{member.fullName}</option>)}
          </select>
        </label>
        <label className="toggle-field">
          <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />
          <span><Archive size={14} /> Include archived</span>
        </label>
        {(priority || assigneeId || includeArchived) ? (
          <Button variant="ghost" size="sm" onClick={() => { setPriority(''); setAssigneeId(''); setIncludeArchived(false); }}>
            <Settings2 size={15} /> Clear filters
          </Button>
        ) : null}
      </Card>

      <KanbanBoard
        tasks={tasksQuery.data ?? []}
        members={membersQuery.data ?? []}
        readOnly={!canEdit}
        onOpenTask={(task) => {
          setSelectedTask(task);
          setSearchParams({ task: task.id }, { replace: true });
        }}
        onMoveTask={(task, status) => statusMutation.mutate({ task, status })}
      />

      <TaskModal
        open={createOpen || Boolean(selectedTask)}
        onClose={closeTaskModal}
        workspaceId={workspaceId}
        projectId={projectId}
        {...(selectedTask ? { task: selectedTask } : {})}
        members={membersQuery.data ?? []}
        workspaceLabels={labelsQuery.data ?? []}
        canEdit={canEdit}
      />

      <Modal open={labelOpen} onClose={() => setLabelOpen(false)} title="Create a workspace label" description="Labels can be attached to tasks in any project in this workspace." size="sm">
        <form className="form-stack" onSubmit={(event) => { event.preventDefault(); createLabelMutation.mutate(); }}>
          <label className="field"><span>Label name</span><input value={labelName} maxLength={50} onChange={(event) => setLabelName(event.target.value)} autoFocus /></label>
          <label className="field"><span>Label color</span><div className="color-field"><input type="color" value={labelColor} onChange={(event) => setLabelColor(event.target.value)} /><input value={labelColor} pattern="^#[0-9A-Fa-f]{6}$" onChange={(event) => setLabelColor(event.target.value)} /></div></label>
          <div className="button-row button-row--end"><Button type="button" variant="ghost" onClick={() => setLabelOpen(false)}>Cancel</Button><Button type="submit" disabled={!labelName.trim()} isLoading={createLabelMutation.isPending}>Create label</Button></div>
        </form>
      </Modal>
    </div>
  );
};
