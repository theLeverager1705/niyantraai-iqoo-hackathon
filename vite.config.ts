import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));

/**
 * Relative base so the production build can be opened straight from disk
 * (file://) as well as served from any static host or sub-path. The router is
 * a HashRouter for the same reason.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${src}/` }],
  },
  server: {
    port: 5173,
    open: false,
    fs: { strict: false },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep the charting library out of the initial parse so the landing
        // page and dashboard shell paint before it is needed.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
