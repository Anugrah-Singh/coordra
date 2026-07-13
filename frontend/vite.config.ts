import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          data: ['@tanstack/react-query', 'axios', 'socket.io-client'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          interactions: ['@dnd-kit/core'],
          ui: ['lucide-react', 'sonner'],
        },
      },
    },
  },
});
