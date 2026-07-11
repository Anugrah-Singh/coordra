import { getIo } from '../socket.js';

export const emitWorkspaceEvent = (
  workspaceId: string,
  eventName: string,
  payload: Record<string, unknown>
) => {
  try {
    getIo().to(workspaceId).emit(eventName, payload);
  } catch (error) {
    console.error(`[Socket Emit Error] ${eventName}:`, error);
  }
};

export const emitUserEvent = (
  userId: string,
  eventName: string,
  payload: Record<string, unknown>
) => {
  try {
    getIo().to(`user:${userId}`).emit(eventName, payload);
  } catch (error) {
    console.error(`[User Socket Emit Error] ${eventName}:`, error);
  }
};