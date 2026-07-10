import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import userRoutes from './routes/user.route.js';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { createServer } from 'http';
import { initSocket } from './socket.js'; 
// 1. Import our Database Engine & SQL helper
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';


// 2. Import our Routers (The Waiters)
import workspaceRoutes from './routes/workspace.route.js';

const app = express();
const PORT = process.env.PORT || 8000;

const httpServer = createServer(app);

initSocket(httpServer);

// --- Global Security & Parsing Middleware ---
app.use(helmet()); // Secures HTTP headers against common exploits
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })); // Allows cross-origin requests from your future React frontend
app.use(cookieParser());
app.use(express.json()); // Parses incoming raw JSON into req.body

// --- System Diagnostics Routes ---
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.get('/test-db', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await db.execute(sql`SELECT current_timestamp`);
        res.json({
            success: true,
            message: "The Pooled Connection is alive!",
            database_time: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
});

// --- RAW POST DIAGNOSTIC ---
app.post('/api/test', (req: Request, res: Response) => {
  res.status(200).json({ message: "DIRECT POST IS WORKING" });
});

// --- Core API Routes ---
// This mounts our Workspace router to the /api/workspaces prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);

// --- 404 Handler ---
// This catches requests that did not match any route above.
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


// --- Global Error Handler ---
app.use(globalErrorHandler);

// --- Boot Sequence ---
httpServer.listen(PORT, () => {
    console.log(`Server initialized on http://localhost:${PORT}`);
    console.log('Websocket Server initialized')
});
