import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Phase 1 foundation.
// Bound to 0.0.0.0 so it can be previewed inside a sandbox/container.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // D1: sandbox/preview host (e.g. *.e2b.app) থেকে খোলার অনুমতি — শুধু dev server-এর জন্য।
    allowedHosts: true,
    // Never allow a browser-side call to reach another origin: the Supabase URL is
    // read from env at build time only. No secrets are embedded in this file.
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
