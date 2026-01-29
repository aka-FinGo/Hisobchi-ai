/**
 * START: APP.TSX (1-BO'LIM)
 * API Key inputlari, Detail Modal mantiqi va Sahifalar boshqaruvi.
 */

import { useState, useEffect } from 'react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Home, BarChart2, Plus, Sparkles, User, Fingerprint, Save, CheckCircle, Camera, Key, FileText } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Category } from './types';

// Komponentlar
import HomePage from './components/HomePage';
import AIPage from './components/AIPage';
import StatsPage from './components/StatsPage';
import TransactionModal from './components/TransactionModal';
import TransactionDetailModal from './components/TransactionDetailModal';

// START: PROFIL SAHIFASI (API KEYLAR BILAN)
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
  const [settings, setSettings] = useState(data.settings);
  const [isChanged, setIsChanged] = useState(false);

  const update = (key: string, val: any) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    setIsChanged(JSON.stringify(next) !== JSON.stringify(data.settings));
  };

  return (
    <div className="scroll-area p-6 space-y-6">
      <h2 className="text-2xl font-black text-neon uppercase italic tracking-tighter">PROFIL & API</h2>
      
      {/* API KEY KIRITISH BLOKI */}
      <div className="bg-panel p-5 rounded-[32px] border border-white/5 space-y-4">
          <p className="text-[10px] font-black text-neon uppercase ml-1 flex items-center gap-2"><Key size={12}/> API Kalitlar</p>
          <input 
            type="password"
            placeholder="Gemini API Key" 
            value={settings.geminiKey || ''} 
            onChange={e => update('geminiKey', e.target.value)}
            className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-xs text-white outline-none focus:border-neon"
          />
          <input 
            type="password"
            placeholder="Groq API Key" 
            value={settings.groqKey || ''} 
            onChange={e => update('groqKey', e.target.value)}
            className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-xs text-white outline-none focus:border-[#f55036]"
          />
      </div>

      {/* MODEL TANLASH VA BOSHQA SOZLAMALAR (Avvalgi kod kabi...) */}
      <button 
        disabled={!isChanged} 
        onClick={() => { onUpdateSettings(settings); setIsChanged(false); }}
        className={`w-full py-5 rounded-[24px] font-black tracking-widest ${isChanged ? 'bg-neon text-black' : 'bg-gray-800 text-gray-500'}`}
      >
        SAQLASH
      </button>
    </div>
  );
};
/** END OF PROFILE SECTION **/
/**
 * START: APP.TSX (2-BO'LIM)
 * TransactionDetailModal integratsiyasi va Asosiy App render.
 */

export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'ai' | 'profile'>('home');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  // START: Tranzaksiyani o'chirish
  const handleDeleteTx = (id: string) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    setDetailTx(null);
  };

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
        {/* ... Profile va AI ... */}
      </main>

      {/* --- TRANZAKSIYA TAFSILOTLARI MODALI --- */}
      <TransactionDetailModal 
        isOpen={!!detailTx} 
        onClose={() => setDetailTx(null)} 
        transaction={detailTx}
        category={data.categories.find(c => c.id === detailTx?.categoryId)}
        onDelete={handleDeleteTx}
        onEdit={(tx) => { setDetailTx(null); /* Tahrirlash mantiqi */ }}
        onFilter={() => {}}
      />

      {/* ... Navigatsiya va Qo'shish modali ... */}
    </div>
  );
}
/** END OF APP.TSX **/
