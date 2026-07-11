import { Server as HttpServer } from 'node:http';

import { and, eq, isNull } from 'drizzle-orm';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

import { env } from './config/env.js';
import { db } from './db/index.js';
import { workspaceMembers } from './db/schema/workspaces.js';
import { AUTH_COOKIE_NAME } from './utils/auth-cookie.js';

let io: Server | undefined;

type AuthTokenPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseCookies = (
  cookieHeader?: string
): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((cookies, item) => {
      const [rawName, ...rawValueParts] = item.trim().split('=');

      if (!rawName) {
        return cookies;
      }

      cookies[rawName] = decodeURIComponent(
        rawValueParts.join('=')
      );

      return cookies;
    }, {});
};

const getWorkspaceMembership = async (
  workspaceId: string,
  userId: string
) => {
  const [membership] = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
        isNull(workspaceMembers.removedAt)
      )
    )
    .limit(1);

  return membership;
};

export const initSocket = (server: HttpServer): Server => {
  const socketServer = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io = socketServer;

  socketServer.use((socket, next) => {
    try {
      const cookies = parseCookies(
        socket.handshake.headers.cookie
      );

      const token = cookies[AUTH_COOKIE_NAME];

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const decoded = jwt.verify(
        token,
        env.JWT_SECRET
      ) as AuthTokenPayload;

      if (!decoded.userId) {
        next(new Error('Invalid authentication token'));
        return;
      }

      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;

      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  socketServer.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    console.log(
      `Authenticated socket connected: ${socket.id}`
    );

    console.log(
      `User ${userId} joined notification room: ${userRoom}`
    );

    socket.on(
      'join_workspace',
      async (workspaceId: string) => {
        try {
          if (!uuidRegex.test(workspaceId)) {
            socket.emit('workspace_error', {
              message: 'Invalid workspace ID',
            });
            return;
          }

          const membership =
            await getWorkspaceMembership(
              workspaceId,
              userId
            );

          if (!membership) {
            socket.emit('workspace_error', {
              message:
                'You do not have access to this workspace',
            });
            return;
          }

          socket.join(workspaceId);

          socket.emit('workspace_joined', {
            workspaceId,
            role: membership.role,
          });

          console.log(
            `User ${userId} joined workspace room ${workspaceId}`
          );
        } catch (error) {
          console.error(
            '[Socket join_workspace error]:',
            error
          );

          socket.emit('workspace_error', {
            message: 'Failed to join workspace',
          });
        }
      }
    );

    socket.on(
      'leave_workspace',
      (workspaceId: string) => {
        if (!uuidRegex.test(workspaceId)) {
          socket.emit('workspace_error', {
            message: 'Invalid workspace ID',
          });
          return;
        }

        socket.leave(workspaceId);

        socket.emit('workspace_left', {
          workspaceId,
        });

        console.log(
          `User ${userId} left workspace room ${workspaceId}`
        );
      }
    );

    socket.on('disconnect', (reason) => {
      console.log(
        `Socket disconnected: ${socket.id}; reason: ${reason}`
      );
    });
  });

  return socketServer;
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }

  return io;
};

export const closeSocketServer =
  async (): Promise<void> => {
    if (!io) {
      return;
    }

    const socketServer = io;
    io = undefined;

    await new Promise<void>((resolve) => {
      socketServer.close(() => {
        resolve();
      });
    });
  };