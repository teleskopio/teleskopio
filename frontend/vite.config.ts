import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [tailwindcss(), react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src'),
      util: resolve(__dirname, 'src/util.ts'),
      fs: resolve(__dirname, 'src/fs.ts'),
    },
  },
  clearScreen: false,
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3080',
    },
  },
  // build: {
  //   rollupOptions: {
  //     input: {
  //       main: resolve(__dirname, 'index.html'),
  //       notfound: resolve(__dirname, 'public/404.html'),
  //     },
  //   },
  // },
}));
