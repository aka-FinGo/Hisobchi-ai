import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { 
  Home, BarChart2, Plus, Sparkles, User, Lock, 
  Fingerprint, Camera, Server, Save, CheckCircle 
} from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

// --- 1. PROFIL SAHIFASI KOMPONENTI ---
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    // Null check: Agar settings yo'q bo'lsa, bo'sh obyekt olamiz
    const settings = data.settings || {};

    const [name, setName] = useState(settings.userName || '');
    const [pin, setPin] = useState(settings.pinCode || '');
    const [biometrics, setBiometrics] = useState(settings.useBiometrics || false);
    
    // AI State
    const [geminiKey, setGeminiKey] = useState(settings.geminiKey || '');
    const [groqKey, setGroqKey] = useState(settings.groqKey || '');
    const [preferred, setPreferred] = useState(settings.preferredProvider || 'gemini');
    const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-2.5-flash');
    const [groqModel, setGroqModel] = useState(settings.groqModel || 'llama-3.3-70b-versatile');
    
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        onUpdateSettings({
            ...settings,
            userName: name,
            pinCode: pin || null,
            useBiometrics: biometrics,
            geminiKey,
            groqKey,
            preferredProvider: preferred,
            geminiModel,
            groqModel
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0e17] animate-slideUp">
            {/* Header */}
            <div className="p-6 pt-10 pb-4 shrink-0 bg-[#0a0e17] z-10 sticky top-0 border-b border-white/5">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="text-[#00d4ff]"/> Profil Sozlamalari
                 </h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
                
                {/* Avatar & Name */}
                <div className="flex flex-col items-center my-8">
                    <div className="relative mb-4">
                        <img src={data.profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#141e3c] shadow-2xl object-cover"/>
                        <button className="absolute bottom-0 right-0 p-2 bg-[#00d4ff] rounded-full text-[#0a0e17] shadow-lg">
                            <Camera size={16}/>
                        </button>
                    </div>
                    <input 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="bg-transparent text-center text-xl font-bold text-white outline-none border-b border-transparent focus:border-[#00d4ff] pb-1 w-2/3"
                        placeholder="Ismingiz"
                    />
                </div>

                {/* AI Settings */}
                <div className="mb-8">
                    <h3 className="text-gray-500 text-[10px] font-bold uppercase mb-4 ml-1 tracking-widest text-center">Sun'iy Intellekt</h3>
                    <div className="bg-[#141e3c] p-5 rounded-3xl border border-white/5 space-y-6">
                        
                        {/* Gemini */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-[#00d4ff] text-xs font-bold">Google Gemini</p>
                                <select value={geminiModel} onChange={e => setGeminiModel(e.target.value as any)} className="bg-[#0a0e17] text-white text-[10px] p-1 rounded border border-white/10 outline-none">
                                    <option value="gemini-3-flash">Gemini 3 Flash</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                </select>
                            </div>
                            <input type="text" placeholder="Gemini API Key" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 text-xs font-mono outline-none"/>
                        </div>

                        {/* Groq */}
                        <div className="space-y-3">
                             <div className="flex justify-between items-center">
                                <p className="text-[#f55036] text-xs font-bold">Groq (Compound)</p>
                                <select value={groqModel} onChange={e => setGroqModel(e.target.value as any)} className="bg-[#0a0e17] text-white text-[10px] p-1 rounded border border-white/10 outline-none">
                                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                                    <option value="llama3-8b-8192">Llama 3 8B</option>
                                </select>
                            </div>
                            <input type="text" placeholder="Groq API Key" value={groqKey} onChange={e => setGroqKey(e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 text-xs font-mono outline-none"/>
                        </div>

                        {/* Provider Switch */}
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-gray-500 text-[10px] font-bold mb-3 uppercase text-center">Asosiy provayder</p>
                            <div className="flex bg-[#0a0e17] p-1 rounded-xl border border-white/10">
                                <button onClick={() => setPreferred('gemini')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${preferred === 'gemini' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Gemini</button>
                                <button onClick={() => setPreferred('groq')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${preferred === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>Groq</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="mb-10">
                    <h3 className="text-gray-500 text-[10px] font-bold uppercase mb-4 ml-1 tracking-widest text-center">Xavfsizlik</h3>
                    <div className="bg-[#141e3c] rounded-3xl overflow-hidden border border-white/5">
                        <div className="p-5 border-b border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3"><Lock size={18} className="text-[#00d4ff]"/><span className="text-white text-sm font-bold">PIN Kod</span></div>
                                <div className="relative inline-block w-10 h-6 align-middle select-none" onClick={() => { if(pin) setPin(''); else setPin('0000'); }}>
                                    <div className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${pin ? 'bg-[#00d4ff]' : 'bg-gray-600'}`}></div>
                                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${pin ? 'left-5' : 'left-1'}`}></div>
                                </div>
                            </div>
                            {pin && (<input type="number" placeholder="PIN (4 ta raqam)" value={pin} onChange={e => { if(e.target.value.length <= 4) setPin(e.target.value); }} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl text-center tracking-[12px] font-mono outline-none border border-white/10 focus:border-[#00d4ff]"/>)}
                        </div>
                        <div className="p-5 flex justify-between items-center">
                             <div className="flex items-center gap-3"><Fingerprint size={18} className="text-[#ff3366]"/><span className="text-white text-sm font-bold">Barmoq izi</span></div>
                             <button onClick={() => setBiometrics(!biometrics)} className={`w-10 h-6 rounded-full relative transition-colors ${biometrics ? 'bg-[#ff3366]' : 'bg-gray-600'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${biometrics ? 'left-5' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-lg mb-12 ${isSaved ? 'bg-[#107c41] text-white' : 'bg-[#00d4ff] text-[#0a0e17]'}`}>
                    {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>}
                    {isSaved ? "Muvaffaqiyatli Saqlandi" : "Sozlamalarni Saqlash"}
                </button>
            </div>
        </div>
    );
};

// --- 2. LOCK SCREEN KOMPONENTI ---
const LockScreen = ({ correctPin, onUnlock }: { correctPin: string, onUnlock: () => void }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const handleInput = (val: string) => {
        const newVal = input + val; setInput(newVal);
        if (newVal.length === correctPin.length) {
            if (newVal === correctPin) onUnlock();
            else { setError(true); setTimeout(() => { setInput(''); setError(false); }, 500); }
        }
    };
    return (
        <div className="fixed inset-0 z-[300] bg-[#05070a] flex flex-col items-center justify-center">
            <div className="p-4 bg-[#141e3c] rounded-full mb-8"><Lock size={32} className="text-[#00d4ff]"/></div>
            <div className="flex gap-4 mb-10">{[...Array(correctPin.length)].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border border-[#00d4ff] ${i < input.length ? 'bg-[#00d4ff]' : ''} ${error ? 'animate-bounce bg-red-500' : ''}`}></div>))}</div>
            <div className="grid grid-cols-3 gap-6">{[1,2,3,4,5,6,7,8,9].map(n => (<button key={n} onClick={() => handleInput(n.toString())} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl">{n}</button>))}<div/><button onClick={() => handleInput('0')} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl">0</button><button onClick={() => setInput(input.slice(0,-1))} className="w-16 h-16 rounded-full text-gray-500">⬅️</button></div>
        </div>
    );
};

// --- 3. ASOSIY APP KOMPONENTI ---
type TabType = 'home' | 'stats' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isLocked, setIsLocked] = useState(false);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  const [statsFilter, setStatsFilter] = useState<FilterState | null>(null);

  // Initial Load
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    if (loaded.settings?.pinCode) {
        setIsLocked(true);
    }
  }, []);

  // Auto Save
  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  // Back Button Logic
  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      if (isLocked) return;
      if (isTxModalOpen || isWalletModalOpen || detailTx || contextMenu) {
         setIsTxModalOpen(false); setIsWalletModalOpen(false); setDetailTx(null); setContextMenu(null); return;
      }
      if (activeTab !== 'home') { setActiveTab('home'); return; }
      CapacitorApp.exitApp();
    });
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, activeTab, isLocked]);

  // Loading Screen (Qora ekran bo'lmasligi uchun)
  if (!data) return <div className="h-screen bg-[#0a0e17] flex items-center justify-center text-white font-bold">Yuklanmoqda...</div>;
  
  // Lock Screen
  if (isLocked && data.settings?.pinCode) return <LockScreen correctPin={data.settings.pinCode} onUnlock={() => setIsLocked(false)} />;

  // Handlers
  const handleWalletSave = (wallet: Wallet) => {
    if (editingWallet) setData({ ...data, wallets: data.wallets.map(x => x.id === w.id ? wallet : x) });
    else setData({ ...data, wallets: [...data.wallets, wallet] });
    setIsWalletModalOpen(false); setEditingWallet(null);
  };

  const handleTransactionSave = (txData: Transaction) => {
    let newTx = [...data.transactions];
    let newW = [...data.wallets];
    if (editingTx) { 
       const old = data.transactions.find(t => t.id === editingTx.id);
       if(old) {
          newW = newW.map(w => w.id === old.walletId ? { ...w, balance: w.balance + (old.type === 'income' ? -old.amount : old.amount) } : w);
          newTx = newTx.filter(t => t.id !== editingTx.id);
       }
    }
    const finalTx = { ...txData, id: txData.id || Date.now().toString() };
    newTx.push(finalTx);
    newW = newW.map(w => w.id === finalTx.walletId ? { ...w, balance: w.balance + (finalTx.type === 'income' ? finalTx.amount : -finalTx.amount) } : w);
    setData({ ...data, transactions: newTx, wallets: newW });
    setIsTxModalOpen(false); setEditingTx(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0e17] text-[#e0e0ff]" onClick={() => setContextMenu(null)}>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
          {activeTab === 'home' && <HomePage data={data} onNavigate={(p) => setActiveTab(p as any)} onTransactionClick={setDetailTx} onContextMenu={(e, i, t) => setContextMenu({ x: e.clientX, y: e.clientY, item: i, type: t })} onAddWallet={() => { setEditingWallet(null); setIsWalletModalOpen(true); }} onRefresh={() => setData(loadData())}/>}
          {activeTab === 'stats' && <StatsPage data={data} initialFilter={statsFilter} onClearFilter={() => setStatsFilter(null)} onTxClick={setDetailTx} />}
          {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />}
          {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={(s) => setData({...data, settings: s})} />}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl pb-6 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center px-8">
           <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}><Home/></button>
           <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}><BarChart2/></button>
           <div className="relative -top-8">
              <button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/40 text-[#00d4ff] flex items-center justify-center shadow-lg active:scale-90"><Plus size={32}/></button>
           </div>
           <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-[#00d4ff]' : 'text-gray-600'}><User/></button>
           <button onClick={() => setActiveTab('ai')} className={activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}><Sparkles/></button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
          <div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 z-[150]" style={{ top: contextMenu.y - 120, left: Math.min(contextMenu.x, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); } else { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } setContextMenu(null); }} className="w-full text-left p-3 text-sm font-bold">Tahrirlash</button>
              <div className="h-[1px] bg-white/5 my-1"></div>
              <button onClick={() => { 
                  if(!confirm("Ishonchingiz komilmi?")) return;
                  if(contextMenu.type === 'tx') {
                      const tx = contextMenu.item;
                      const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w);
                      setData({ ...data, transactions: data.transactions.filter(t => t.id !== tx.id), wallets: newW });
                  } else {
                      if(data.wallets.length > 1) setData({ ...data, wallets: data.wallets.filter(w => w.id !== contextMenu.item.id) });
                  }
                  setContextMenu(null);
              }} className="w-full text-left p-3 text-rose-500 text-sm font-bold">O'chirish</button>
          </div>
      )}

      {/* Modals */}
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onSave={handleWalletSave} initialData={editingWallet} />
      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSave={handleTransactionSave} categories={data.categories} wallets={data.wallets} allTransactions={data.transactions} initialData={editingTx} onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} onUpdateCategories={(u) => setData({...data, categories: u})} settings={data.settings}/>
      <TransactionDetailModal isOpen={!!detailTx} onClose={() => setDetailTx(null)} transaction={detailTx} category={data.categories.find(c => c.id === detailTx?.categoryId)} wallet={data.wallets.find(w => w.id === detailTx?.walletId)} onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }} onDelete={() => {}} onFilter={(f) => { setStatsFilter(f); setDetailTx(null); setActiveTab('stats'); }} />
    </div>
  );
}

export default App;
