import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aka.fingo.hisobchi', // O'zingizga moslang
  appName: 'Hisobchi AI',
  webDir: 'dist', // <--- MUHIM: 'dist' bo'lishi kerak ('build' yoki 'public' emas)
  server: {
    androidScheme: 'https'
  }
};

export default config;