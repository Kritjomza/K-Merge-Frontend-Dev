import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Disable proxy when running e2e with mocks to avoid ECONNREFUSED
    // Use NO_PROXY=1 to turn off proxying
    proxy: process.env.NO_PROXY === '1' ? undefined : {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/works': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
