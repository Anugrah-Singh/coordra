import { readFileSync } from 'node:fs';
import { io } from 'socket.io-client';

const workspaceId = process.argv[2];

if (!workspaceId) {
  console.error('Usage: npx tsx scripts/test-socket-client.ts <workspaceId>');
  process.exit(1);
}

const cookieJar = readFileSync('cookies.txt', 'utf8');

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

socket.on('project_created', (payload) => {
  console.log('📁 project_created:', JSON.stringify(payload, null, 2));
});

socket.on('project_updated', (payload) => {
  console.log('📝 project_updated:', JSON.stringify(payload, null, 2));
});

socket.on('project_deleted', (payload) => {
  console.log('🗑️ project_deleted:', JSON.stringify(payload, null, 2));
});

socket.on('task_status_changed', (payload) => {
  console.log('🔁 task_status_changed:', JSON.stringify(payload, null, 2));
});

socket.on('task_assigned', (payload) => {
  console.log('👷 task_assigned:', JSON.stringify(payload, null, 2));
});

socket.on('task_archived', (payload) => {
  console.log('📦 task_archived:', JSON.stringify(payload, null, 2));
});

socket.on('task_unarchived', (payload) => {
  console.log('📤 task_unarchived:', JSON.stringify(payload, null, 2));
});

socket.on('task_duplicated', (payload) => {
  console.log('📄 task_duplicated:', JSON.stringify(payload, null, 2));
});

socket.on('comment_updated', (payload) => {
  console.log('✏️ comment_updated:', JSON.stringify(payload, null, 2));
});

socket.on('comment_deleted', (payload) => {
  console.log('🗑️ comment_deleted:', JSON.stringify(payload, null, 2));
});

socket.on('label_created', (payload) => {
  console.log('🏷️ label_created:', JSON.stringify(payload, null, 2));
});

socket.on('label_updated', (payload) => {
  console.log('🏷️ label_updated:', JSON.stringify(payload, null, 2));
});

socket.on('label_deleted', (payload) => {
  console.log('🏷️ label_deleted:', JSON.stringify(payload, null, 2));
});

socket.on('task_label_added', (payload) => {
  console.log('🔖 task_label_added:', JSON.stringify(payload, null, 2));
});

socket.on('task_label_removed', (payload) => {
  console.log('🔖 task_label_removed:', JSON.stringify(payload, null, 2));
});

socket.on('notification_created', (payload) => {
  console.log('🔔 notification_created:', JSON.stringify(payload, null, 2));
});

socket.on('notification_read', (payload) => {
  console.log('✅ notification_read:', JSON.stringify(payload, null, 2));
});

socket.on('notifications_read_all', (payload) => {
  console.log('✅ notifications_read_all:', JSON.stringify(payload, null, 2));
});

socket.on('workspace_invite_created', (payload) => {
  console.log('📨 workspace_invite_created:', JSON.stringify(payload, null, 2));
});

socket.on('workspace_invite_deleted', (payload) => {
  console.log('🗑️ workspace_invite_deleted:', JSON.stringify(payload, null, 2));
});

socket.on('workspace_invite_accepted', (payload) => {
  console.log('✅ workspace_invite_accepted:', JSON.stringify(payload, null, 2));
});

socket.on('workspace_invite_declined', (payload) => {
  console.log('❌ workspace_invite_declined:', JSON.stringify(payload, null, 2));
});