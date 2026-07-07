import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            credentials: true,
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_workspace', (workspaceId: string) => {
            socket.join(workspaceId);
            console.log(`Socket ${socket.id} joined Workspace Room: ${workspaceId}`);
        });

        socket.on('leave_workspace', (workspaceId: string) => {
            socket.leave(workspaceId);
            console.log(`Socket ${socket.id} left Workspace Room: ${workspaceId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};