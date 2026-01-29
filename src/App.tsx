/* --- START: ASOSIY ILOVA LOGIKASI (1-BO'LIM) --- */
import { useState, useEffect } from 'react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Home, Sparkles, User, Fingerprint, Save, CheckCircle, Camera, Loader2 } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction } from './types';

// Sahifalar
import HomePage from './components/HomePage';
import AIPage from './components/AIPage';

// MODELLAR RO'YXATI
const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
  { id: 'gemma-3-27b', name: 'Gemma 3 27B' },
  { id: 'gemini-robotics-er-1.5-preview', name: 'Robotics ER 1.5' },
  { id: 'gemini-2.5-flash-native-audio-dialog', name: 'Native Audio Dialog' }
];

const GROQ_MODELS = [
  { id: 'groq/compound', name: 'Groq Compound' },
  { id: 'groq/compound-mini', name: 'Groq Compound Mini' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
  { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2' }
];

// PROFIL SAHIFASI
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
  const [settings, setSettings] = useState(data.settings);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // START: O'zgarishni kuzatish
  const handleUpdate = (key: string, val: any) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    setIsChanged(JSON.stringify(next) !== JSON.stringify(data.settings));
  };

  // START: Saqlash funksiyasi
  const handleSave = () => {
    onUpdateSettings(settings);
    setIsChanged(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="scroll-area p-6 space-y-6">
      <h2 className="text-2xl font-black text-neon flex items-center gap-2"><User/> PROFIL</h2>
      
      <div className="bg-panel p-5 rounded-[30px] border border-white/5 space-y-5">
          <div className="flex bg-black/40 p-1 rounded-xl">
              <button onClick={() => handleUpdate('preferredProvider', 'gemini')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${settings.preferredProvider === 'gemini' ? 'bg-neon text-black' : 'text-gray-500'}`}>GEMINI</button>
              <button onClick={() => handleUpdate('preferredProvider', 'groq')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${settings.preferredProvider === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>GROQ</button>
          </div>
          
          <select value={settings.geminiModel} onChange={e => handleUpdate('geminiModel', e.target.value)} className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs outline-none">
              {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={settings.groqModel} onChange={e => handleUpdate('groqModel', e.target.value)} className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs outline-none">
              {GROQ_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
      </div>

      <button disabled={!isChanged} onClick={handleSave} className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-green-500 text-white' : isChanged ? 'bg-neon text-black' : 'bg-gray-800 text-gray-500'}`}>
          {isSaved ? <CheckCircle/> : <Save/>} {isSaved ? "SAQLANDI" : "SAQLASH"}
      </button>
    </div>
  );
};
/* --- ASOSIY ILOVA KOMPONENTI (2-BO'LIM) --- */
export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'home' | 'ai' | 'profile'>('home');
  const [isLocked, setIsLocked] = useState(data.settings.useBiometrics);

  // START: Avto-saqlash
  useEffect(() => { saveData(data); }, [data]);

  // START: Biometrika (Native)
  useEffect(() => {
    if (isLocked) {
      NativeBiometric.verifyIdentity({ reason: "Ilovaga kirish", title: "Xavfsizlik", subtitle: "Tasdiqlang" })
        .then(() => setIsLocked(false))
        .catch(() => console.log("Biometrika xatosi"));
    }
  }, [isLocked]);

  if (isLocked) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center">
      <Fingerprint size={80} className="text-neon animate-pulse mb-6" />
      <button onClick={() => setIsLocked(true)} className="text-neon font-black tracking-widest uppercase">Tasdiqlash</button>
    </div>
  );

  return (
    <div className="h-screen bg-background text-white flex flex-col overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && <HomePage data={data} onNavigate={setActiveTab as any} />}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={(tx) => setData({...data, transactions: [tx, ...data.transactions]})} />}
        {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={s => setData({...data, settings: s})} />}
      </main>

      <nav className="h-20 bg-panel/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6">
        <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl ${activeTab === 'home' ? 'text-neon bg-neon/10' : 'text-gray-500'}`}><Home/></button>
        <button onClick={() => setActiveTab('ai')} className={`p-5 rounded-full bg-neon text-black -translate-y-6 shadow-[0_0_30px_rgba(0,212,255,0.4)]`}><Sparkles/></button>
        <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-2xl ${activeTab === 'profile' ? 'text-neon bg-neon/10' : 'text-gray-500'}`}><User/></button>
      </nav>
    </div>
  );
}
/* --- END OF APP.TSX --- */
