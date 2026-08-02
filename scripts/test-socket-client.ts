import { readFileSync } from 'node:fs';
import { io } from 'socket.io-client';

const workspaceId = process.argv[2];
if (!workspaceId) {
  console.error('Usage: npx tsx scripts/test-socket-client.ts <workspaceId>');
  process.exit(1);
}

const authToken = readFileSync('cookies.txt', 'utf8')
  .split('\n')
  .find((line) => line.includes('\tauth_token\t'))
  ?.split('\t')
  .at(-1);
if (!authToken) {
  console.error(
    'auth_token not found in cookies.txt. Login first with curl -c cookies.txt.'
  );
  process.exit(1);
}

const socket = io('http://localhost:8000', {
  extraHeaders: { Cookie: `auth_token=${authToken}` },
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
  socket.emit('workspace:join', workspaceId);
});
socket.on('connect_error', (error) => console.error('Connection error:', error.message));
socket.on('workspace:joined', (payload) => console.log('Workspace joined:', payload));
socket.on('workspace:error', (payload) => console.error('Workspace error:', payload));
socket.on('workspace:changed', (payload) => console.log('Workspace changed:', payload));
socket.on('notifications:changed', (payload) =>
  console.log('Notifications changed:', payload)
);
