import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// jsonplaceholder.org does not send CORS headers, so the browser cannot call
// it directly from localhost. The dev server proxies /api/* to the real API.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://jsonplaceholder.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'https://jsonplaceholder.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
