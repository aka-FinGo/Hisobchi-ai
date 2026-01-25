import { useState } from 'react';
import { Download, Upload, Trash2, Cpu, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { utils, write } from 'xlsx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { saveData, loadData } from '../storage';
import { AppData, AIProvider } from '../types';

interface SettingsProps {
  data: AppData;
  onDataChange: () => void;
}

export default function SettingsPage({ data, onDataChange }: SettingsProps) {
  const [aiSettings, setAiSettings] = useState(data.aiSettings);

  // --- EXCEL EXPORT (TELEFON UCHUN) ---
  const handleExportExcel = async () => {
    try {
      // 1. Excel kitob yaratish
      const wb = utils.book_new();
      utils.book_append_sheet(wb, utils.json_to_sheet(data.transactions), "Tranzaksiyalar");
      
      // 2. Base64 formatda yozish (Mobil uchun shart)
      const wbout = write(wb, { bookType: 'xlsx', type: 'base64' });

      // 3. Faylni vaqtinchalik xotiraga saqlash
      const fileName = `Hisobot_${Date.now()}.xlsx`;
      const result = await Filesystem.writeFile({
        path: fileName,
        data: wbout,
        directory: Directory.Cache, // Kesh papkaga saqlaymiz
      });

      // 4. "Ulashish" (Share) oynasini ochish
      await Share.share({
        title: 'Moliya hisoboti',
        text: 'Mening moliyaviy hisobotim',
        url: result.uri,
        dialogTitle: 'Hisobotni Excelda ochish',
      });

    } catch (e) {
      alert("Xatolik: Excel fayl yaratib bo'lmadi. " + e);
    }
  };

  const handleAiSave = () => {
    const newData = { ...data, aiSettings };
    saveData(newData);
    alert("AI sozlamalari saqlandi!");
  };

  return (
    <div className="p-4 pb-24 pt-safe space-y-6">
      <h1 className="text-2xl font-bold text-white">Sozlamalar Pro</h1>

      {/* AI SOZLAMALARI */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-4 border border-blue-500/30">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <Cpu size={20} />
          <h2 className="text-lg font-semibold">Sun'iy Intellekt (AI)</h2>
        </div>

        <div>
          <label className="text-sm text-gray-400">Platforma</label>
          <select 
            value={aiSettings.provider}
            onChange={(e) => setAiSettings({...aiSettings, provider: e.target.value as AIProvider})}
            className="w-full bg-gray-900 p-3 rounded-lg mt-1 text-white border border-gray-700"
          >
            <option value="gemini">Google Gemini</option>
            <option value="groq">Groq (Llama 3)</option>
            <option value="openai">OpenAI (ChatGPT)</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">API Kalit (Key)</label>
          <input 
            type="password"
            value={aiSettings.apiKey}
            onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
            placeholder="AI Studio API Key..."
            className="w-full bg-gray-900 p-3 rounded-lg mt-1 text-white border border-gray-700"
          />
        </div>

        {/* Token statistikasi */}
        <div className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-400">Ishlatilgan tokenlar:</span>
          <span className={`font-mono font-bold ${aiSettings.tokensUsed > aiSettings.tokenLimit ? 'text-red-500' : 'text-green-500'}`}>
            {aiSettings.tokensUsed} / {aiSettings.tokenLimit}
          </span>
        </div>

        <button onClick={handleAiSave} className="w-full bg-blue-600 py-2 rounded-lg text-white font-medium">
          Sozlamani Saqlash
        </button>
      </div>

      {/* EXCEL BLOKI */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FileSpreadsheet className="text-green-500"/> Eksport
        </h2>
        <button 
          onClick={handleExportExcel}
          className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Download size={20} /> Excelga Yuklash (.xlsx)
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Fayl "Share" menyusi orqali ochiladi. Telegram yoki Excel dasturini tanlang.
        </p>
      </div>

      {/* XAVFLI HUDUD */}
      <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4">
        <button onClick={() => {localStorage.clear(); onDataChange();}} className="w-full text-red-500 py-2 flex items-center justify-center gap-2">
          <Trash2 size={18} /> Barchasini o'chirish
        </button>
      </div>
    </div>
  );
}
