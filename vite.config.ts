import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // OLDINGI: base: '/Hisobchi-ai/',
  // YANGI (APK uchun to'g'risi):
  base: './', 
  build: {
    outDir: 'dist',
  }
})
