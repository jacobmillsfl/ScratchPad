import react from '@vitejs/plugin-react';
import { join } from 'path';
import { defineConfig } from 'vite';

const srcRoot = join(__dirname, 'src');

export default defineConfig({
  root: srcRoot,
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '/@': srcRoot,
    },
  },
  build: {
    outDir: join(srcRoot, 'out'),
    emptyOutDir: true,
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    strictPort: true,
  },
});
