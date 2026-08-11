import { z } from 'zod';

export const wId = z.uuid('Invalid workspace ID');
export const pId = z.uuid('Invalid project ID');
export const tId = z.uuid('Invalid task ID');

export const workspaceParams = z.object({ workspaceId: wId });
export const projectParams = z.object({ workspaceId: wId, projectId: pId });
export const taskParams = z.object({ workspaceId: wId, projectId: pId, taskId: tId });
