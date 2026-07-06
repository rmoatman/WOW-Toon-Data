import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local dev, proxy /api to the Express server so the client can call
// the API at a same-origin path. In production, VITE_API_URL points at the
// deployed Render API service.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
