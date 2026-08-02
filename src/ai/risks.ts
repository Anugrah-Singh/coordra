export type PulseRisk = {
  severity: 'high' | 'medium';
  condition: string;
  suggestedAction: string;
  projectId?: string;
  taskId?: string;
  memberId?: string;
};

type RiskTask = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
};

type RiskProject = {
  id: string;
  name: string;
  taskCounts: { unfinished: number };
  lastActivityAt: Date;
  memberLoad: Array<{
    memberId: string;
    memberName: string;
    activeTasks: number;
  }>;
};

export const deriveRisks = (input: {
  tasks: RiskTask[];
  projects: RiskProject[];
  now: Date;
}): PulseRisk[] => {
  const risks: PulseRisk[] = [];
  const in48Hours = input.now.getTime() + 48 * 60 * 60 * 1000;
  const sevenDaysAgo = input.now.getTime() - 7 * 24 * 60 * 60 * 1000;

  for (const task of input.tasks) {
    if (task.status !== 'DONE' && task.dueDate && task.dueDate < input.now) {
      risks.push({
        severity: 'high',
        condition: `“${task.title}” is incomplete and past due.`,
        suggestedAction: 'Confirm an owner and a realistic next deadline.',
        projectId: task.projectId,
        taskId: task.id,
      });
    }
    if (task.status === 'BLOCKED') {
      risks.push({
        severity: 'high',
        condition: `“${task.title}” is blocked.`,
        suggestedAction: 'Identify the blocker and assign the next unblock step.',
        projectId: task.projectId,
        taskId: task.id,
      });
    }
    if (task.priority === 'URGENT' && !task.assigneeId && task.status !== 'DONE') {
      risks.push({
        severity: 'high',
        condition: `Urgent task “${task.title}” is unassigned.`,
        suggestedAction: 'Assign an accountable owner.',
        projectId: task.projectId,
        taskId: task.id,
      });
    }
    if (
      task.status === 'BACKLOG' &&
      task.dueDate &&
      task.dueDate.getTime() >= input.now.getTime() &&
      task.dueDate.getTime() <= in48Hours
    ) {
      risks.push({
        severity: 'medium',
        condition: `Backlog task “${task.title}” is due within 48 hours.`,
        suggestedAction: 'Move it into active work or revisit the due date.',
        projectId: task.projectId,
        taskId: task.id,
      });
    }
  }

  for (const project of input.projects) {
    if (
      project.taskCounts.unfinished > 0 &&
      project.lastActivityAt.getTime() < sevenDaysAgo
    ) {
      risks.push({
        severity: 'medium',
        condition: `“${project.name}” has unfinished work and no activity for seven days.`,
        suggestedAction: 'Confirm whether the project is active and record a next step.',
        projectId: project.id,
      });
    }
    for (const member of project.memberLoad) {
      if (member.activeTasks > 5) {
        risks.push({
          severity: 'medium',
          condition: `${member.memberName} has ${member.activeTasks} active tasks in “${project.name}”.`,
          suggestedAction: 'Review workload and redistribute work if needed.',
          projectId: project.id,
          memberId: member.memberId,
        });
      }
    }
  }

  return risks;
};
