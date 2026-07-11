import { createServer } from 'node:http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import express, { Request, Response } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import {
  closeDatabase,
  db,
} from './db/index.js';

import { globalErrorHandler } from './middlewares/error.middleware.js';
import { apiRateLimiter } from './middlewares/rateLimit.middleware.js';

import authRoutes from './routes/auth.route.js';
import inviteTokenRoutes from './routes/inviteToken.route.js';
import notificationRoutes from './routes/notification.route.js';
import userRoutes from './routes/user.route.js';
import workspaceRoutes from './routes/workspace.route.js';

import {
  closeSocketServer,
  initSocket,
} from './socket.js';

const app = express();
const httpServer = createServer(app);

let isReady = false;
let isShuttingDown = false;

app.disable('x-powered-by');

initSocket(httpServer);

httpServer.requestTimeout = 30_000;
httpServer.headersTimeout = 15_000;
httpServer.keepAliveTimeout = 5_000;

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
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }
);

app.get(
  '/health/ready',
  async (_req: Request, res: Response) => {
    if (isShuttingDown || !isReady) {
      res.status(503).json({
        status: 'not-ready',
        reason: isShuttingDown
          ? 'Server is shutting down'
          : 'Server is starting',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      await db.execute(sql`SELECT 1`);

      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        '[Readiness Check Failed]:',
        error
      );

      res.status(503).json({
        status: 'not-ready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Backwards-compatible health route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Core API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/workspace-invites', inviteTokenRoutes);
app.use('/api/workspaces', workspaceRoutes);

// JSON 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
app.use(globalErrorHandler);

const startServer = async (): Promise<void> => {
  // Fail startup if the database cannot be reached.
  await db.execute(sql`SELECT 1`);

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      reject(error);
    };

    httpServer.once('error', handleError);

    httpServer.listen(env.PORT, () => {
      httpServer.off('error', handleError);
      resolve();
    });
  });

  isReady = true;

  console.log(
    `HTTP server initialized on http://localhost:${env.PORT}`
  );

  console.log('Socket.IO server initialized');
};

const shutdown = async (
  reason: string,
  exitCode = 0
): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  isReady = false;

  console.log(
    `[Shutdown] ${reason} received. Closing services...`
  );

  const forceShutdownTimer = setTimeout(() => {
    console.error(
      '[Shutdown] Graceful shutdown timed out. Forcing exit.'
    );

    httpServer.closeAllConnections();
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  forceShutdownTimer.unref();

  try {
    // Socket.IO also closes the attached HTTP server.
    await closeSocketServer();

    await closeDatabase();

    clearTimeout(forceShutdownTimer);

    console.log('[Shutdown] Completed successfully.');

    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceShutdownTimer);

    console.error('[Shutdown] Failed:', error);

    httpServer.closeAllConnections();
    process.exit(1);
  }
};

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('uncaughtException', (error) => {
  console.error('[Uncaught Exception]:', error);
  void shutdown('uncaughtException', 1);
});

process.once('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]:', reason);
  void shutdown('unhandledRejection', 1);
});

void startServer().catch(async (error) => {
  console.error('[Startup Failed]:', error);

  try {
    await closeSocketServer();
    await closeDatabase();
  } finally {
    process.exit(1);
  }
});