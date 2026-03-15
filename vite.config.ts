import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['path', 'url', 'fs', 'process'],
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false,
  },
});
