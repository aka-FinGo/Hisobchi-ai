/**
 * START: ASOSIY APP KOMPONENTI (1-BO'LIM)
 * Importlar, Biometrika va AI Modellar ro'yxati.
 */

import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Home, BarChart2, Plus, Sparkles, User, Fingerprint, Save, CheckCircle, Camera, FileText } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet } from './types';

// Komponentlar
import HomePage from './components/HomePage';
import AIPage from './components/AIPage';
import StatsPage from './components/StatsPage';
import TransactionModal from './components/TransactionModal';

// DOIMIY MODELLAR RO'YXATI
const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-2.5-flash-tts', name: 'Gemini 2.5 Flash TTS' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
  { id: 'gemini-robotics-er-1.5-preview', name: 'Gemini Robotics ER 1.5' },
  { id: 'gemma-3-27b', name: 'Gemma 3 27B' },
  { id: 'gemma-3-12b', name: 'Gemma 3 12B' },
  { id: 'gemma-3-4b', name: 'Gemma 3 4B' },
  { id: 'gemini-2.5-flash-native-audio', name: 'Gemini 2.5 Flash Audio' }
];

const GROQ_MODELS = [
  { id: 'groq/compound', name: 'Groq Compound' },
  { id: 'groq/compound-mini', name: 'Groq Compound Mini' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
  { id: 'allam-2-7b', name: 'Allam 2 7B' }
];

// ... (Dovomi 2-bo'limda)
/**
 * START: APP.TSX (2-BO'LIM)
 * ProfilePage va Asosiy App Logikasi.
 */

const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
  const [settings, setSettings] = useState(data.settings);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Funksiya: Sozlamalarni yangilash (Faqat o'zgarsa tugma aktiv bo'ladi)
  const update = (key: string, val: any) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    setIsChanged(JSON.stringify(next) !== JSON.stringify(data.settings));
  };

  // Funksiya: Saqlash mantiqi
  const handleSave = () => {
    onUpdateSettings(settings);
    setIsChanged(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="scroll-area p-6 space-y-6">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><User className="text-neon"/> PROFIL</h2>
      
      {/* SHAXSIY MA'LUMOTLAR */}
      <div className="flex flex-col items-center py-4 bg-panel rounded-[32px] border border-white/5 mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-neon p-1 mb-3">
              <img src={data.profile.avatar} className="rounded-full w-full h-full object-cover" />
          </div>
          <input 
            value={settings.userName} 
            onChange={e => update('userName', e.target.value)} 
            className="bg-transparent text-center text-lg font-bold outline-none border-b border-white/10 w-2/3" 
          />
      </div>

      {/* AI SOZLAMALARI BLOKI */}
      <div className="bg-panel p-5 rounded-[30px] border border-white/5 space-y-5">
          <p className="text-[10px] font-black text-neon uppercase tracking-widest ml-1">AI Provayder</p>
          <div className="flex bg-black/40 p-1 rounded-xl">
              <button onClick={() => update('preferredProvider', 'gemini')} className={`flex-1 py-2 rounded-lg text-[10px] font-black ${settings.preferredProvider === 'gemini' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-gray-500'}`}>GEMINI</button>
              <button onClick={() => update('preferredProvider', 'groq')} className={`flex-1 py-2 rounded-lg text-[10px] font-black ${settings.preferredProvider === 'groq' ? 'bg-[#f55036] text-white shadow-lg' : 'text-gray-500'}`}>GROQ</button>
          </div>
          
          <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Gemini Model</label>
                <select value={settings.geminiModel} onChange={e => update('geminiModel', e.target.value)} className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs text-white outline-none">
                    {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Groq Model</label>
                <select value={settings.groqModel} onChange={e => update('groqModel', e.target.value)} className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs text-white outline-none">
                    {GROQ_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
          </div>
      </div>

      <button disabled={!isChanged} onClick={handleSave} className={`w-full py-5 rounded-[22px] font-black transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-green-500 shadow-green-500/20' : isChanged ? 'bg-neon text-black shadow-neon/30' : 'bg-gray-800 text-gray-600'}`}>
          {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>} {isSaved ? "SAQLANDI" : "SAQLASH"}
      </button>
    </div>
  );
};

// --- ASOSIY EKSPORT (Fix: Default export qo'shildi) ---
export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'ai' | 'profile'>('home');
  const [isLocked, setIsLocked] = useState(data.settings.useBiometrics);

  useEffect(() => { saveData(data); }, [data]);

  // Biometrik tekshiruv (PIN-kod o'rniga)
  useEffect(() => {
    if (isLocked) {
      NativeBiometric.verifyIdentity({ reason: "Ilovaga kirish uchun tasdiqlang", title: "Xavfsizlik", subtitle: "Biometrika kerak" })
        .then(() => setIsLocked(false))
        .catch(() => console.log("Biometrika rad etildi"));
    }
  }, [isLocked]);

  if (isLocked) return <div className="h-screen bg-background flex flex-col items-center justify-center"><Fingerprint size={64} className="text-neon animate-pulse mb-4"/><button onClick={() => setIsLocked(true)} className="text-neon text-sm font-bold uppercase tracking-widest">Qulfni ochish</button></div>;

  return (
    <div className="h-screen bg-background text-white flex flex-col font-sans overflow-hidden">
        <main className="flex-1 relative overflow-hidden">
            {activeTab === 'home' && <HomePage data={data} onNavigate={setActiveTab as any} />}
            {activeTab === 'ai' && <AIPage data={data} onAddTransaction={(tx) => setData({...data, transactions: [tx, ...data.transactions]})} />}
            {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={s => setData({...data, settings: s})} />}
        </main>
        
        {/* NAV BAR */}
        <nav className="h-20 bg-panel/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4">
            <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-all ${activeTab === 'home' ? 'text-neon bg-neon/10' : 'text-gray-500'}`}><Home size={24}/></button>
            <button onClick={() => setActiveTab('ai')} className={`p-4 rounded-full bg-neon text-black -translate-y-6 shadow-2xl shadow-neon/40 transition-all ${activeTab === 'ai' ? 'scale-110 rotate-12' : ''}`}><Sparkles size={28}/></button>
            <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-2xl transition-all ${activeTab === 'profile' ? 'text-neon bg-neon/10' : 'text-gray-500'}`}><User size={24}/></button>
        </nav>
    </div>
  );
}
/** END OF APP.TSX */
