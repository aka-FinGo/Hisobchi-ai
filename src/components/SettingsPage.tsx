import { useState } from 'react';
import { Download, Upload, Key, Trash2 } from 'lucide-react';
import { exportData, importData } from '../storage';

interface SettingsPageProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onDataChange: () => void;
}

export default function SettingsPage({ apiKey, onApiKeyChange, onDataChange }: SettingsPageProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importData(content)) {
        alert('Ma\'lumotlar muvaffaqiyatli yuklandi!');
        onDataChange();
      } else {
        alert('Xatolik: Fayl formati noto\'g\'ri');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Barcha ma\'lumotlar o\'chiriladi. Davom etasizmi?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSaveApiKey = () => {
    onApiKeyChange(localApiKey);
    alert('API kalit saqlandi!');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Sozlamalar</h1>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Key size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-white">AI API Kaliti</h2>
          </div>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="API kalitingizni kiriting"
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none mb-3"
            style={{ fontSize: '16px' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg active:scale-95 transition-all"
            >
              {showApiKey ? 'Yashirish' : 'Ko\'rsatish'}
            </button>
            <button
              onClick={handleSaveApiKey}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg active:scale-95 transition-all"
            >
              Saqlash
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Download size={20} className="text-green-500" />
            <h2 className="text-lg font-semibold text-white">Zaxira nusxa</h2>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Barcha ma'lumotlaringizni JSON faylga saqlang
          </p>
          <button
            onClick={handleExport}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Zaxira yuklab olish
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Upload size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Ma'lumotlarni tiklash</h2>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Zaxira fayldan ma'lumotlarni tiklang
          </p>
          <label className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Upload size={20} />
            Faylni tanlash
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-white">Ma'lumotlarni tozalash</h2>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Barcha ma'lumotlarni o'chirish (qaytarib bo'lmaydi!)
          </p>
          <button
            onClick={handleClearData}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            Barchasini o'chirish
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-2">Dastur haqida</h2>
          <p className="text-gray-400 text-sm">Moliya boshqaruv ilova v1.0</p>
          <p className="text-gray-500 text-xs mt-1">Offline rejimda ishlaydi</p>
        </div>
      </div>
    </div>
  );
}
