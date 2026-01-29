/**
 * START: APP.TSX (1-BO'LIM)
 * Asosiy importlar, AI modellar ro'yxati va Profil sahifasi (API Keylar bilan).
 */

import { useState, useEffect } from 'react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { 
  Home, BarChart2, Plus, Sparkles, User, Fingerprint, 
  Save, CheckCircle, Key, FileText, ChevronDown 
} from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Category } from './types';

// Komponentlarni import qilish
import HomePage from './components/HomePage';
import AIPage from './components/AIPage';
import StatsPage from './components/StatsPage';
import TransactionModal from './components/TransactionModal';
import TransactionDetailModal from './components/TransactionDetailModal';

// START: MODELLAR KONSTANTALARI
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
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' }
];

/**
 * START: ProfilePage Komponenti
 * API Key kiritish inputlari va model tanlash shu yerda.
 */
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
  const [settings, setSettings] = useState(data.settings);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const update = (key: string, val: any) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    setIsChanged(JSON.stringify(next) !== JSON.stringify(data.settings));
  };

  const handleSave = () => {
    onUpdateSettings(settings);
    setIsChanged(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="scroll-area p-6 space-y-6">
      <h2 className="text-2xl font-black text-neon flex items-center gap-2 tracking-tighter italic"><User/> PROFIL</h2>
      
      {/* API KEYLAR BLOKI */}
      <div className="bg-panel p-5 rounded-[32px] border border-white/5 space-y-4">
          <p className="text-[10px] font-black text-neon uppercase flex items-center gap-2 ml-1"><Key size={12}/> API Integratsiya</p>
          <input 
            type="password"
            placeholder="Gemini API Key" 
            value={settings.geminiKey || ''} 
            onChange={e => update('geminiKey', e.target.value)}
            className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-xs text-white outline-none focus:border-neon transition-all"
          />
          <input 
            type="password"
            placeholder="Groq API Key" 
            value={settings.groqKey || ''} 
            onChange={e => update('groqKey', e.target.value)}
            className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-xs text-white outline-none focus:border-[#f55036] transition-all"
          />
      </div>

      {/* MODEL TANLASH BLOKI */}
      <div className="bg-panel p-5 rounded-[32px] border border-white/5 space-y-4">
          <div className="flex bg-black/40 p-1 rounded-xl">
              <button onClick={() => update('preferredProvider', 'gemini')} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${settings.preferredProvider === 'gemini' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-gray-500'}`}>GEMINI</button>
              <button onClick={() => update('preferredProvider', 'groq')} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${settings.preferredProvider === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>GROQ</button>
          </div>
          <select value={settings.geminiModel} onChange={e => update('geminiModel', e.target.value)} className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs outline-none">
              {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={settings.groqModel} onChange={e => update('groqModel', e.target.value)} className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs outline-none">
              {GROQ_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
      </div>

      <button disabled={!isChanged} onClick={handleSave} className={`w-full py-5 rounded-[22px] font-black transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-green-500 text-white' : isChanged ? 'bg-neon text-black shadow-neon/30' : 'bg-gray-800 text-gray-600'}`}>
          {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>} {isSaved ? "SAQLANDI" : "SOZLAMALARNI SAQLASH"}
      </button>
    </div>
  );
};
/**
 * START: APP.TSX (2-BO'LIM)
 * Tranzaksiyalarni boshqarish, Detail Modal va FAB tugmasi.
 */

export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'ai' | 'profile'>('home');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [isLocked, setIsLocked] = useState(data.settings.useBiometrics);

  useEffect(() => { saveData(data); }, [data]);

  // START: Biometrika (Native)
  useEffect(() => {
    if (isLocked) {
      NativeBiometric.verifyIdentity({ reason: "Ilovaga kirish", title: "Xavfsizlik", subtitle: "Biometrika" })
        .then(() => setIsLocked(false))
        .catch(() => console.log("Biometrika rad etildi"));
    }
  }, [isLocked]);

  // START: Ma'lumotlarni yangilash funksiyalari
  const handleAddTx = (tx: Transaction) => {
    setData(prev => ({ ...prev, transactions: [tx, ...prev.transactions] }));
    setIsTxModalOpen(false);
  };

  const handleDeleteTx = (id: string) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    setDetailTx(null);
  };

  const handleUpdateCategories = (cats: Category[]) => {
    setData(prev => ({ ...prev, categories: cats }));
  };
  // END: Yangilash funksiyalari

  if (isLocked) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center">
      <Fingerprint size={80} className="text-neon animate-pulse mb-6" />
      <button onClick={() => setIsLocked(true)} className="text-neon font-black tracking-widest uppercase">Tasdiqlash</button>
    </div>
  );

  return (
    <div className="h-screen bg-background text-white flex flex-col overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && (
          <HomePage 
            data={data} 
            onNavigate={(page: any) => setActiveTab(page)} 
            onTransactionClick={(tx) => setDetailTx(tx)} // AMALNI BOSGANDA DETAIL OCHILADI
            onContextMenu={() => {}} 
            onAddWallet={() => {}} 
            onRefresh={() => {}}
          />
        )}
        {activeTab === 'stats' && (
          <StatsPage 
            data={data} 
            initialFilter={null} 
            onClearFilter={() => {}} 
            onTxClick={(tx) => setDetailTx(tx)} // STATSDA HAM DETAIL OCHILADI
          />
        )}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleAddTx} />}
        {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={s => setData({...data, settings: s})} />}
      </main>

      {/* --- (+) QO'LDA QO'SHISH TUGMASI (FAB) --- */}
      <div className="fixed bottom-24 right-6 z-[100]">
          <button 
            onClick={() => setIsTxModalOpen(true)}
            className="w-14 h-14 bg-neon text-black rounded-2xl shadow-lg shadow-neon/40 flex items-center justify-center active:scale-90 transition-all"
          >
            <Plus size={32} strokeWidth={3}/>
          </button>
      </div>

      {/* --- NAVIGATSIYA PANELI --- */}
      <nav className="h-20 bg-panel/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 relative z-[90]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-neon' : 'text-gray-500'}`}>
            <Home size={22}/> <span className="text-[8px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-neon' : 'text-gray-500'}`}>
            <BarChart2 size={22}/> <span className="text-[8px] font-bold uppercase tracking-widest">Stats</span>
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ai' ? 'text-neon' : 'text-gray-500'}`}>
            <div className={`p-3 rounded-xl ${activeTab === 'ai' ? 'bg-neon/10' : ''}`}><Sparkles size={22}/></div>
            <span className="text-[8px] font-bold uppercase tracking-widest">AI</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-neon' : 'text-gray-500'}`}>
            <User size={22}/> <span className="text-[8px] font-bold uppercase tracking-widest">User</span>
        </button>
      </nav>

      {/* MODALLAR INTEGRATSIYASI */}
      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        onSave={handleAddTx} 
        categories={data.categories} 
        wallets={data.wallets} 
        allTransactions={data.transactions} 
        onAddCategory={() => {}} 
        onUpdateCategories={handleUpdateCategories} 
        settings={data.settings} 
      />

      <TransactionDetailModal 
        isOpen={!!detailTx} 
        onClose={() => setDetailTx(null)} 
        transaction={detailTx}
        category={data.categories.find(c => c.id === detailTx?.categoryId)}
        onDelete={handleDeleteTx}
        onEdit={(tx) => { setDetailTx(null); /* Tahrirlash mantiqi */ }}
        onFilter={() => {}}
      />
    </div>
  );
}
/** END OF APP.TSX **/
