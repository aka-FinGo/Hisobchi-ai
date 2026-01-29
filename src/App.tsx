import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, Sparkles, User, Lock, Shield, Fingerprint, Key, Camera, Server, Save, CheckCircle } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

// --- PROFIL SAHIFASI ---
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    const [name, setName] = useState(data.settings.userName || '');
    const [pin, setPin] = useState(data.settings.pinCode || '');
    const [biometrics, setBiometrics] = useState(data.settings.useBiometrics || false);
    
    // AI STATE
    const [geminiKey, setGeminiKey] = useState(data.settings.geminiKey || '');
    const [groqKey, setGroqKey] = useState(data.settings.groqKey || '');
    const [preferred, setPreferred] = useState(data.settings.preferredProvider || 'gemini');
    
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        onUpdateSettings({
            ...data.settings,
            userName: name,
            pinCode: pin || null,
            useBiometrics: biometrics,
            geminiKey,
            groqKey,
            preferredProvider: preferred
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleAvatarChange = () => {
        alert("Rasm yuklash funksiyasi tez orada qo'shiladi!");
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0e17] animate-slideUp">
            <div className="p-6 pt-10 pb-4 shrink-0 bg-[#0a0e17] z-10 sticky top-0">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><User className="text-[#00d4ff]"/> Profil</h2>
            </div>
            
            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 scroll-area">
                
                {/* 1. AVATAR */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-4">
                        <img src={data.profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#141e3c] shadow-2xl object-cover"/>
                        <button onClick={handleAvatarChange} className="absolute bottom-0 right-0 p-2 bg-[#00d4ff] rounded-full text-[#0a0e17] shadow-lg active:scale-95">
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

                {/* 2. AI SOZLAMALARI (MULTI-KEY) */}
                <div className="mb-6">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">AI Kalitlar (API Keys)</h3>
                    <div className="bg-[#141e3c] p-4 rounded-2xl border border-white/5 space-y-5">
                        
                        {/* Asosiy Provayder */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><Server size={14} className="text-[#00ff9d]"/> Asosiy AI</p>
                            <div className="flex bg-[#0a0e17] rounded-xl p-1 border border-white/10">
                                <button onClick={() => setPreferred('gemini')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${preferred === 'gemini' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Gemini</button>
                                <button onClick={() => setPreferred('groq')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${preferred === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>Groq</button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">Agar asosiysi ishlamasa, ikkinchisiga avtomatik o'tadi.</p>
                        </div>

                        {/* Gemini Key Input */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 text-[#00d4ff]">Google Gemini API Key</p>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="AIzaSy..."
                                    value={geminiKey} 
                                    onChange={e => setGeminiKey(e.target.value)} 
                                    className="w-full bg-[#0a0e17] text-white p-3 pl-10 rounded-xl outline-none border border-white/10 focus:border-[#00d4ff] text-xs font-mono"
                                />
                                <Key size={14} className="absolute left-3 top-3.5 text-gray-500"/>
                            </div>
                        </div>

                        {/* Groq Key Input */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 text-[#f55036]">Groq (Llama 3) API Key</p>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="gsk_..."
                                    value={groqKey} 
                                    onChange={e => setGroqKey(e.target.value)} 
                                    className="w-full bg-[#0a0e17] text-white p-3 pl-10 rounded-xl outline-none border border-white/10 focus:border-[#f55036] text-xs font-mono"
                                />
                                <Key size={14} className="absolute left-3 top-3.5 text-gray-500"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. XAVFSIZLIK SOZLAMALARI */}
                <div className="mb-6">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Xavfsizlik</h3>
                    <div className="bg-[#141e3c] rounded-2xl overflow-hidden border border-white/5">
                        <div className="p-4 border-b border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg"><Lock size={18} className="text-[#00d4ff]"/></div><span className="text-white text-sm font-bold">PIN Kod</span></div>
                                <div className="relative inline-block w-10 h-6 align-middle select-none"><input type="checkbox" checked={!!pin} onChange={() => { if(pin) setPin(''); else setPin('0000'); }} className="hidden"/><div className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${pin ? 'bg-[#00d4ff]' : 'bg-gray-600'}`} onClick={() => { if(pin) setPin(''); else setPin('0000'); }}></div><div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${pin ? 'left-5' : 'left-1'}`}></div></div>
                            </div>
                            {pin && (<input type="number" placeholder="PIN (4 ta)" value={pin} onChange={e => { const val = e.target.value; if(val.length <= 4) setPin(val); }} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl text-center tracking-[8px] font-mono outline-none border border-white/10 focus:border-[#00d4ff]"/>)}
                        </div>
                        
                        <div className="p-4 flex justify-between items-center">
                             <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg"><Fingerprint size={18} className="text-[#ff3366]"/></div><span className="text-white text-sm font-bold">Barmoq izi</span></div>
                             <button onClick={() => setBiometrics(!biometrics)} className={`w-10 h-6 rounded-full relative transition-colors ${biometrics ? 'bg-[#ff3366]' : 'bg-gray-600'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${biometrics ? 'left-5' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <button onClick={handleSave} className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-lg mb-10 ${isSaved ? 'bg-[#107c41] text-white' : 'bg-[#00d4ff] text-[#0a0e17]'}`}>
                    {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>}
                    {isSaved ? "SAQLANDI" : "SOZLAMALARNI SAQLASH"}
                </button>
            </div>
        </div>
    );
};

// --- LOCK SCREEN ---
const LockScreen = ({ correctPin, onUnlock }: { correctPin: string, onUnlock: () => void }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const handleInput = (val: string) => {
        const newVal = input + val;
        setInput(newVal);
        if (newVal.length === correctPin.length) {
            if (newVal === correctPin) onUnlock();
            else {
                setError(true);
                setTimeout(() => { setInput(''); setError(false); }, 500);
            }
        }
    }

    return (
        <div className="fixed inset-0 z-[300] bg-[#05070a] flex flex-col items-center justify-center animate-slideUp">
            <div className="p-4 bg-[#141e3c] rounded-full mb-8"><Lock size={32} className="text-[#00d4ff]"/></div>
            <h2 className="text-white font-bold text-xl mb-8">Parolni kiriting</h2>
            <div className="flex gap-4 mb-10">
                {[...Array(correctPin.length)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border border-[#00d4ff] ${i < input.length ? 'bg-[#00d4ff]' : ''} ${error ? 'animate-bounce bg-red-500 border-red-500' : ''}`}></div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                    <button key={n} onClick={() => handleInput(n.toString())} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl active:scale-90">{n}</button>
                ))}
                <div/>
                <button onClick={() => handleInput('0')} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl active:scale-90">0</button>
                <button onClick={() => setInput(input.slice(0,-1))} className="w-16 h-16 rounded-full text-gray-500 flex items-center justify-center active:scale-90">⬅️</button>
            </div>
        </div>
    )
}

type TabType = 'home' | 'stats' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [historyStack, setHistoryStack] = useState<TabType[]>([]);
  
  const [isLocked, setIsLocked] = useState(!!(data.settings?.pinCode && data.settings.pinCode.length === 4));

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  const [statsFilter, setStatsFilter] = useState<FilterState | null>(null);

  useEffect(() => { saveData(data); }, [data]);

  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      if (isLocked) return;
      if (isTxModalOpen || isWalletModalOpen || detailTx || contextMenu) {
         setIsTxModalOpen(false); setIsWalletModalOpen(false); setDetailTx(null); setContextMenu(null);
         return;
      }
      if (historyStack.length > 0) {
         const prev = historyStack[historyStack.length - 1];
         setHistoryStack(p => p.slice(0, -1)); setActiveTab(prev);
         return;
      }
      if (activeTab !== 'home') { setActiveTab('home'); return; }
      CapacitorApp.exitApp();
    });
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab, isLocked]);

  const refreshData = () => { setData(loadData()); };

  const handleWalletSave = (wallet: Wallet) => {
    if (editingWallet) setData({ ...data, wallets: data.wallets.map(w => w.id === wallet.id ? wallet : w) });
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
    setIsTxModalOpen(false); setEditingTx(null); setDetailTx(null);
  };

  const handleDeleteTx = (id: string) => {
     if(!confirm("Haqiqatan ham bu amalni o'chirmoqchimisiz?")) return;
     const tx = data.transactions.find(t => t.id === id);
     if(!tx) return;
     const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w);
     setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newW });
     setContextMenu(null); setDetailTx(null);
  };

  const handleDeleteWallet = (id: string) => {
      if(data.wallets.length <= 1) return;
      if(!confirm("Hamyonni o'chirsangiz, barcha tarixiy ma'lumotlar yo'qoladi. Rozimisiz?")) return;
      setData({ ...data, wallets: data.wallets.filter(w => w.id !== id), transactions: data.transactions.filter(t => t.walletId !== id) });
      setContextMenu(null);
  };

  const handleJumpToFilter = (filter: FilterState) => {
    setStatsFilter(filter); setDetailTx(null); setActiveTab('stats');
  };

  if (isLocked && data.settings?.pinCode) {
      return <LockScreen correctPin={data.settings.pinCode} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0e17] font-['Plus_Jakarta_Sans'] select-none text-[#e0e0ff]" onClick={() => setContextMenu(null)}>
      
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full w-full">
          {activeTab === 'home' && (
              <HomePage 
                  data={data} 
                  onNavigate={(p) => { setHistoryStack(prev => [...prev, activeTab]); setActiveTab(p as any); }}
                  onTransactionClick={setDetailTx}
                  onContextMenu={(e, i, t) => setContextMenu({ x: e.clientX, y: e.clientY, item: i, type: t })}
                  onAddWallet={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
                  onRefresh={refreshData}
              />
          )}
          {activeTab === 'stats' && (
              <StatsPage data={data} initialFilter={statsFilter} onClearFilter={() => setStatsFilter(null)} onTxClick={setDetailTx} />
          )}
          {activeTab === 'ai' && (
              <AIPage data={data} onAddTransaction={handleTransactionSave} />
          )}
          {activeTab === 'profile' && (
              <ProfilePage data={data} onUpdateSettings={(s) => setData({...data, settings: s})} />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl pb-5 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center px-6">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <Home size={24}/>
           </button>
           <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <BarChart2 size={24}/>
           </button>
           <div className="relative -top-7">
              <button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/40 text-[#00d4ff] flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.3)] active:scale-95 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <User size={24}/>
           </button>
           <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <Sparkles size={24}/>
           </button>
        </div>
      </div>

      {contextMenu && (
          <div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); } if(contextMenu.type === 'wallet') { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } setContextMenu(null); }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">✏️ Tahrirlash</button>
              <div className="h-[1px] bg-white/5 my-1"></div>
              <button onClick={() => { if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); else handleDeleteWallet(contextMenu.item.id); }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">🗑️ O'chirish</button>
          </div>
      )}

      <WalletModal isOpen={isWalletModalOpen} onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }} onSave={handleWalletSave} initialData={editingWallet} />
      
      <TransactionModal 
          isOpen={isTxModalOpen} 
          onClose={() => setIsTxModalOpen(false)} 
          onSave={handleTransactionSave} 
          categories={data.categories} 
          wallets={data.wallets} 
          allTransactions={data.transactions}
          initialData={editingTx} 
          onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} 
          onUpdateCategories={(u) => setData({...data, categories: u})}
          settings={data.settings}
      />
      
      <TransactionDetailModal 
          isOpen={!!detailTx} 
          onClose={() => setDetailTx(null)} 
          transaction={detailTx} 
          category={data.categories.find(c => c.id === detailTx?.categoryId)} 
          wallet={data.wallets.find(w => w.id === detailTx?.walletId)} 
          onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }} 
          onDelete={handleDeleteTx} 
          onFilter={handleJumpToFilter} 
      />
    </div>
  );
}
export default App;
