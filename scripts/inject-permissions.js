const fs = require('fs');
const path = require('path');

// Manifest fayl yo'li (Robot yaratgan papka ichida)
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
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Skriptda xatolik:', err);
    process.exit(1);
}
