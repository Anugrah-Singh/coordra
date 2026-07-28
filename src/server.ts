import { createServer } from 'node:http';

import { sql } from 'drizzle-orm';

import { createApp } from './app.js';
import { env } from './config/env.js';

import { closeDatabase, db } from './db/index.js';

import { closeSocketServer, initSocket } from './socket.js';

let isReady = false;
let isShuttingDown = false;

const app = createApp({
  isReady: () => isReady,
  isShuttingDown: () => isShuttingDown,
});

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.requestTimeout = 30_000;
httpServer.headersTimeout = 15_000;
httpServer.keepAliveTimeout = 5_000;

const startServer = async (): Promise<void> => {
  // Fail startup when the database
  // cannot be reached.
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

  console.log(`HTTP server initialized on ` + `http://localhost:${env.PORT}`);

  console.log('Socket.IO server initialized');
};

const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  isReady = false;

  console.log(`[Shutdown] ${reason} received. ` + 'Closing services...');

  const forceShutdownTimer = setTimeout(() => {
    console.error('[Shutdown] Graceful shutdown ' + 'timed out. Forcing exit.');

    httpServer.closeAllConnections();
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  forceShutdownTimer.unref();

  try {
    // Socket.IO also closes the
    // attached HTTP server.
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
