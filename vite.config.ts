import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Build vaqtida yo'llar to'g'ri shakllanishi uchun
  build: {
    outDir: 'dist',
  }
});
