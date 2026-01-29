import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Home, BarChart2, Plus, Sparkles, User, Fingerprint, Camera, Save, CheckCircle, FileText, ChevronDown } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

/**
 * MODELLAR RO'YXATI (aka_FinGo tomonidan taqdim etilgan)
 */
const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.5-flash-tts', name: 'Gemini 2.5 Flash TTS' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
    { id: 'gemini-robotics-er-1.5-preview', name: 'Gemini Robotics ER 1.5' },
    { id: 'gemma-3-27b', name: 'Gemma 3 27B' },
    { id: 'gemma-3-12b', name: 'Gemma 3 12B' },
    { id: 'gemma-3-4b', name: 'Gemma 3 4B' }
];

const GROQ_MODELS = [
    { id: 'groq/compound', name: 'Groq Compound' },
    { id: 'groq/compound-mini', name: 'Groq Compound Mini' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
    { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' }
];

// ... (Kod davomi 2-bo'limda)
/* --- START: PROFIL SAHIFASI KOMPONENTI --- */
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    const [settings, setSettings] = useState(data.settings);
    const [isChanged, setIsChanged] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // START: O'zgarishlarni tekshirish funksiyasi
    const handleUpdate = (key: string, val: any) => {
        const newSettings = { ...settings, [key]: val };
        setSettings(newSettings);
        // Faqat haqiqiy o'zgarish bo'lgandagina saqlash tugmasi yonadi
        setIsChanged(JSON.stringify(newSettings) !== JSON.stringify(data.settings));
    };
    // END: O'zgarishlarni tekshirish funksiyasi

    // START: Sozlamalarni saqlash funksiyasi
    const onSave = () => {
        onUpdateSettings(settings);
        setIsChanged(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    // END: Sozlamalarni saqlash funksiyasi

    return (
        <div className="scroll-area p-6 space-y-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2"><User className="text-[#00d4ff]"/> Profil</h2>
            
            {/* AI MODEL SELECTOR SECTION */}
            <div className="bg-[#141e3c] p-5 rounded-[32px] border border-white/5 space-y-6">
                <div className="flex bg-[#0a0e17] p-1 rounded-2xl border border-white/10">
                    <button onClick={() => handleUpdate('preferredProvider', 'gemini')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${settings.preferredProvider === 'gemini' ? 'bg-[#00d4ff] text-black shadow-lg' : 'text-gray-500'}`}>GEMINI</button>
                    <button onClick={() => handleUpdate('preferredProvider', 'groq')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${settings.preferredProvider === 'groq' ? 'bg-[#f55036] text-white shadow-lg' : 'text-gray-500'}`}>GROQ</button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Gemini Model</label>
                        <select value={settings.geminiModel} onChange={(e) => handleUpdate('geminiModel', e.target.value)} className="w-full bg-[#0a0e17] text-white p-4 rounded-2xl border border-white/10 outline-none text-sm focus:border-[#00d4ff]">
                            {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-2">Groq Model</label>
                        <select value={settings.groqModel} onChange={(e) => handleUpdate('groqModel', e.target.value)} className="w-full bg-[#0a0e17] text-white p-4 rounded-2xl border border-white/10 outline-none text-sm focus:border-[#f55036]">
                            {GROQ_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <button disabled={!isChanged} onClick={onSave} className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 ${isSaved ? 'bg-green-500 text-white' : isChanged ? 'bg-[#00d4ff] text-black shadow-[0_0_30px_rgba(0,212,255,0.3)]' : 'bg-gray-800 text-gray-600'}`}>
                {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>} {isSaved ? "SAQLANDI" : "SOZLAMALARNI SAQLASH"}
            </button>
        </div>
    );
};
/* --- END: PROFIL SAHIFASI KOMPONENTI --- */

// START: Main App Component
export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'ai' | 'profile'>('home');
  const [isLocked, setIsLocked] = useState(data.settings.useBiometrics);

  useEffect(() => { saveData(data); }, [data]);

  // START: Biometrik Tekshiruv
  useEffect(() => {
    if (isLocked) {
        NativeBiometric.verifyIdentity({ reason: "Ilovaga kirish uchun tasdiqlang", title: "Kirish", subtitle: "Biometrika" })
            .then(() => setIsLocked(false))
            .catch(() => console.log("Biometrika bekor qilindi"));
    }
  }, []);
  // END: Biometrik Tekshiruv

  return (
    <div className="h-full bg-background text-white flex flex-col overflow-hidden">
        {/* Render pages based on activeTab... */}
        {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={(s) => setData({...data, settings: s})} />}
        {/* ... qolgan bo'limlar ... */}
    </div>
  );
}
// END: Main App Component
