import { getIoIfInitialized } from '../socket.js';

export const emitWorkspaceEvent = (
  workspaceId: string,
  eventName: string,
  payload: unknown
): boolean => {
  const io = getIoIfInitialized();

  if (!io) {
    return false;
  }

  const eventPayload = payload as Record<string, unknown>;
  const [resource, ...actionParts] = eventName.split('_');
  io.to(workspaceId).emit(
    'workspace:changed',
    eventName === 'workspace:changed'
      ? payload
      : {
          resource,
          action: actionParts.join('-') || 'changed',
          workspaceId,
          ...eventPayload,
        }
  );

  return true;
};

export const emitUserEvent = (
  userId: string,
  eventName: string,
  payload: unknown
): boolean => {
  const io = getIoIfInitialized();

  if (!io) {
    return false;
  }

  io.to(`user:${userId}`).emit(
    'notifications:changed',
    eventName === 'notifications:changed'
      ? payload
      : { action: eventName.replace(/^notification(s)?_/, ''), ...(payload as object) }
  );

  return true;
};
