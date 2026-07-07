import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import userRoutes from './routes/user.route.js';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';

// 1. Import our Database Engine & SQL helper
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

// 2. Import our Routers (The Waiters)
import workspaceRoutes from './routes/workspace.route.js';

const app = express();
const PORT = process.env.PORT || 8000;

// --- Global Security & Parsing Middleware ---
app.use(helmet()); // Secures HTTP headers against common exploits
app.use(cors()); // Allows cross-origin requests from your future React frontend
app.use(express.json()); // Parses incoming raw JSON into req.body
app.use(cookieParser());

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

// --- The Global Error Handler (The Safety Net) ---
// If any route or Zod validation throws an unexpected error,
//  it falls down here.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('\n [Server Error]:', err.message || err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

app.use(globalErrorHandler);

// --- Boot Sequence ---
app.listen(PORT, () => {
    console.log(`Server initialized on http://localhost:${PORT}`);
});
