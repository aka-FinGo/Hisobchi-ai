import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');

// --- YANGI RUXSATLAR (INTERNET QO'SHILDI) ---
const permissions = `
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />
    `;

try {
    if (fs.existsSync(manifestPath)) {
        let content = fs.readFileSync(manifestPath, 'utf8');
        
        // Agar Internet ruxsati yo'q bo'lsa, qo'shamiz
        if (!content.includes('android.permission.INTERNET')) {
            content = content.replace('<application', `${permissions}\n    <application`);
            fs.writeFileSync(manifestPath, content);
            console.log('✅ Internet va GPS ruxsatlari yozildi!');
        } else {
            console.log('⚠️ Ruxsatlar allaqachon mavjud.');
        }
    } else {
        process.exit(0); 
    }
} catch (err) {
    console.error('❌ Skriptda xatolik:', err);
    process.exit(1);
}
