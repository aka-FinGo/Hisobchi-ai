import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM rejimida __dirname ni aniqlash
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manifest fayl yo'li
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');

// Bizga kerakli BARCHA ruxsatlar (GPS + Barmoq izi)
const permissions = `
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />
    
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    `;

try {
    if (fs.existsSync(manifestPath)) {
        let content = fs.readFileSync(manifestPath, 'utf8');
        
        // Agar ruxsatlar hali qo'shilmagan bo'lsa
        if (!content.includes('USE_BIOMETRIC')) {
            // Ruxsatlarni <application> tegidan oldin joylaymiz
            content = content.replace('<application', `${permissions}\n    <application`);
            fs.writeFileSync(manifestPath, content);
            console.log('✅ GPS va Barmoq izi ruxsatlari muvaffaqiyatli qo\'shildi!');
        } else {
            console.log('⚠️ Ruxsatlar allaqachon mavjud.');
        }
    } else {
        console.error('❌ Xatolik: AndroidManifest.xml topilmadi! (Build jarayonida yaratiladi)');
        process.exit(0); 
    }
} catch (err) {
    console.error('❌ Skriptda xatolik:', err);
    process.exit(1);
}
