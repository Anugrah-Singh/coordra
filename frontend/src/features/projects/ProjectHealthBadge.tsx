'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isOverdue } from '@/lib/format';
import type { Task } from '@/types/api';

export const ProjectHealthBadge = ({ tasks }: { tasks: Task[] }) => {
  const health = useMemo(() => {
    let overdueCount = 0;
    let blockedCount = 0;
    let urgentUnassignedCount = 0;

    for (const task of tasks) {
      if (isOverdue(task.dueDate, task.status)) overdueCount++;
      if (task.status === 'BLOCKED') blockedCount++;
      if (task.priority === 'URGENT' && !task.assigneeId && task.status !== 'DONE') {
        urgentUnassignedCount++;
      }
    }

    const totalRisks = overdueCount + blockedCount + urgentUnassignedCount;
    return {
      totalRisks,
      overdueCount,
      blockedCount,
      urgentUnassignedCount,
      status: totalRisks === 0 ? 'healthy' : totalRisks <= 2 ? 'warning' : 'critical',
    };
  }, [tasks]);

  if (health.status === 'healthy') {
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-medium"
      >
        <CheckCircle2 size={13} className="text-emerald-500" />
        <span>Healthy</span>
      </Badge>
    );
  }

  if (health.status === 'warning') {
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 px-2.5 py-1 text-xs font-medium"
      >
        <AlertTriangle size={13} className="text-amber-500" />
        <span>{`${health.totalRisks} Condition${health.totalRisks > 1 ? 's' : ''} Needing Attention`}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600 px-2.5 py-1 text-xs font-medium"
    >
      <ShieldAlert size={13} className="text-rose-500" />
      <span>{health.totalRisks} High Risk Conditions</span>
    </Badge>
  );
};
