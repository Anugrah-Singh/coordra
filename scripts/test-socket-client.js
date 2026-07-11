import fs from 'fs';
import { io } from 'socket.io-client';
const workspaceId = process.argv[2];
if (!workspaceId) {
    console.error('Usage: npx tsx scripts/test-socket-client.ts <workspaceId>');
    process.exit(1);
}
const cookieJar = fs.readFileSync('cookies.txt', 'utf8');
const authTokenLine = cookieJar
    .split('\n')
    .find((line) => line.includes('\tauth_token\t'));
if (!authTokenLine) {
    console.error('auth_token not found in cookies.txt. Login first with curl -c cookies.txt.');
    process.exit(1);
}
const authToken = authTokenLine.split('\t').at(-1);
if (!authToken) {
    console.error('auth_token value is empty.');
    process.exit(1);
}
const socket = io('http://localhost:8000', {
    extraHeaders: {
        Cookie: `auth_token=${authToken}`,
    },
});
socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    socket.emit('join_workspace', workspaceId);
});
socket.on('connect_error', (error) => {
    console.error('❌ Socket connect error:', error.message);
});
socket.on('workspace_joined', (payload) => {
    console.log('✅ workspace_joined:', payload);
});
socket.on('workspace_error', (payload) => {
    console.error('❌ workspace_error:', payload);
});
socket.on('task_created', (payload) => {
    console.log('📌 task_created:', JSON.stringify(payload, null, 2));
});
socket.on('task_updated', (payload) => {
    console.log('✏️ task_updated:', JSON.stringify(payload, null, 2));
});
socket.on('comment_created', (payload) => {
    console.log('💬 comment_created:', JSON.stringify(payload, null, 2));
});
socket.on('member_added', (payload) => {
    console.log('👤 member_added:', JSON.stringify(payload, null, 2));
});
socket.on('member_role_updated', (payload) => {
    console.log('🛡️ member_role_updated:', JSON.stringify(payload, null, 2));
});
socket.on('member_removed', (payload) => {
    console.log('🚪 member_removed:', JSON.stringify(payload, null, 2));
});
socket.on('owner_transferred', (payload) => {
    console.log('👑 owner_transferred:', JSON.stringify(payload, null, 2));
});
