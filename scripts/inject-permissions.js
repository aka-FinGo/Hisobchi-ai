import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM rejimida __dirname to'g'ridan-to'g'ri ishlamaydi, uni o'zimiz yasaymiz:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manifest fayl yo'li
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');

// Bizga kerakli ruxsatlar
const permissions = `
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
        
        // Agar ruxsatlar allaqachon bo'lmasa, qo'shamiz
        if (!content.includes('ACCESS_FINE_LOCATION')) {
            // Ruxsatlarni <application> tegidan oldin qo'shamiz
            content = content.replace('<application', `${permissions}\n    <application`);
            fs.writeFileSync(manifestPath, content);
            console.log('✅ Ruxsatlar AndroidManifest.xml ga muvaffaqiyatli yozildi!');
        } else {
            console.log('⚠️ Ruxsatlar allaqachon mavjud.');
        }
    } else {
        console.error('❌ Xatolik: AndroidManifest.xml topilmadi! Android papkasi yaratilganiga ishonch hosil qiling.');
        // Xato bo'lsa ham jarayon to'xtab qolmasligi uchun exit(0) qilamiz, 
        // chunki ba'zida papka kechroq paydo bo'lishi mumkin.
        process.exit(0); 
    }
} catch (err) {
    console.error('❌ Skriptda xatolik:', err);
    process.exit(1);
}
