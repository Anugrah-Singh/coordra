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

  io.to(workspaceId).emit(eventName, payload);

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

  io.to(`user:${userId}`).emit(eventName, payload);

  return true;
};
