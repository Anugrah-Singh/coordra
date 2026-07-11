import cookieParser from 'cookie-parser';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import express, {
  Request,
  Response,
} from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { db } from './db/index.js';

import { globalErrorHandler } from './middlewares/error.middleware.js';
import { apiRateLimiter } from './middlewares/rateLimit.middleware.js';

import authRoutes from './routes/auth.route.js';
import inviteTokenRoutes from './routes/inviteToken.route.js';
import notificationRoutes from './routes/notification.route.js';
import userRoutes from './routes/user.route.js';
import workspaceRoutes from './routes/workspace.route.js';

export type AppReadinessState = {
  isReady: () => boolean;
  isShuttingDown: () => boolean;
};

const defaultReadinessState: AppReadinessState = {
  isReady: () => false,
  isShuttingDown: () => false,
};

export const createApp = (
  readinessState: AppReadinessState =
    defaultReadinessState
) => {
  const app = express();

  app.disable('x-powered-by');

  // Security and parsing
  app.use(helmet());

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(cookieParser());

  app.use('/api', apiRateLimiter);

  app.use(
    express.json({
      limit: '100kb',
    })
  );

  // Health checks
  app.get(
    '/health/live',
    (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(
          process.uptime()
        ),
      });
    }
  );

  app.get(
    '/health/ready',
    async (
      _req: Request,
      res: Response
    ) => {
      if (
        readinessState.isShuttingDown() ||
        !readinessState.isReady()
      ) {
        res.status(503).json({
          status: 'not-ready',
          reason:
            readinessState.isShuttingDown()
              ? 'Server is shutting down'
              : 'Server is starting',
          timestamp:
            new Date().toISOString(),
        });

        return;
      }

      try {
        await db.execute(sql`SELECT 1`);

        res.status(200).json({
          status: 'ready',
          database: 'connected',
          timestamp:
            new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          '[Readiness Check Failed]:',
          error
        );

        res.status(503).json({
          status: 'not-ready',
          database: 'disconnected',
          timestamp:
            new Date().toISOString(),
        });
      }
    }
  );

  // Backwards-compatible health route
  app.get(
    '/health',
    (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp:
          new Date().toISOString(),
      });
    }
  );

  // Core API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use(
    '/api/notifications',
    notificationRoutes
  );
  app.use(
    '/api/workspace-invites',
    inviteTokenRoutes
  );
  app.use(
    '/api/workspaces',
    workspaceRoutes
  );

  // JSON 404
  app.use(
    (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message:
          `Route not found: ` +
          `${req.method} ${req.originalUrl}`,
      });
    }
  );

  // Central error handler
  app.use(globalErrorHandler);

  return app;
};