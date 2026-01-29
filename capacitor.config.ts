import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisobchi.ai',
  appName: 'Hisobchi AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      appendPermissionsToManifest: true // Ruxsatlarni avtomatik qo'shish
    },
    Filesystem: {
      appendPermissionsToManifest: true
    }
  }
};

export default config;
