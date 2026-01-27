import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Hisobchi-ai/', // <--- MANA SHU QATORNI QO'SHING! to'g'ri shakllanishi uchun
  build: {
    outDir: 'dist',
  }
});
