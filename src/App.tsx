import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, Sparkles, User, Lock, Shield, Fingerprint, Key, Camera, Server, LogOut } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

// --- PROFIL SAHIFASI KOMPONENTI ---
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    const [name, setName] = useState(data.settings.userName || '');
    const [pin, setPin] = useState(data.settings.pinCode || '');
    const [apiKey, setApiKey] = useState(data.settings.aiApiKey || '');
    const [provider, setProvider] = useState(data.settings.aiProvider || 'gemini');
    const [biometrics, setBiometrics] = useState(data.settings.useBiometrics || false);

    const handleAvatarChange = () => {
        alert("Rasm yuklash funksiyasi tez orada qo'shiladi!");
    };

    return (
        <div className="p-6 pt-10 animate-slideUp pb-32">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2"><User className="text-[#00d4ff]"/> Profil</h2>
            
            {/* 1. AVATAR VA ISM */}
            <div className="flex flex-col items-center mb-10">
                <div className="relative mb-4">
                    <img src={data.profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#141e3c] shadow-2xl object-cover"/>
                    <button onClick={handleAvatarChange} className="absolute bottom-0 right-0 p-2 bg-[#00d4ff] rounded-full text-[#0a0e17] shadow-lg active:scale-95">
                        <Camera size={16}/>
                    </button>
                </div>
                <input 
                    value={name} 
                    onChange={e => { setName(e.target.value); onUpdateSettings({...data.settings, userName: e.target.value}) }} 
                    className="bg-transparent text-center text-xl font-bold text-white outline-none border-b border-transparent focus:border-[#00d4ff] pb-1 w-2/3"
                    placeholder="Ismingiz"
                />
            </div>

            {/* 2. AI SOZLAMALARI */}
            <div className="mb-6">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">AI Integratsiya</h3>
                <div className="bg-[#141e3c] p-4 rounded-2xl border border-white/5 space-y-4">
                    
                    {/* Provayder Tanlash */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/5 rounded-lg"><Server size={18} className="text-[#00ff9d]"/></div>
                            <span className="text-white text-sm font-bold">AI Provayder</span>
                        </div>
                        <div className="flex bg-[#0a0e17] rounded-xl p-1 border border-white/10">
                            <button onClick={() => { setProvider('gemini'); onUpdateSettings({...data.settings, aiProvider: 'gemini'}) }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${provider === 'gemini' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Google Gemini</button>
                            <button onClick={() => { setProvider('groq'); onUpdateSettings({...data.settings, aiProvider: 'groq'}) }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${provider === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>Groq (Llama)</button>
                        </div>
                    </div>

                    {/* API Kalit */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/5 rounded-lg"><Key size={18} className="text-[#bb86fc]"/></div>
                            <span className="text-white text-sm font-bold">API Kalit ({provider === 'gemini' ? 'Gemini' : 'Groq'})</span>
                        </div>
                        <input 
                            type="text" // Password emas, ko'rinib tursin nusxalaganda
                            placeholder={provider === 'gemini' ? "AIzaSy..." : "gsk_..."}
                            value={apiKey} 
                            onChange={e => { setApiKey(e.target.value); onUpdateSettings({...data.settings, aiApiKey: e.target.value}); }} 
                            className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 focus:border-[#bb86fc] text-xs font-mono"
                        />
                        <p className="text-[10px] text-gray-500 mt-2">Agar kalit bo'lmasa, AI ishlamaydi.</p>
                    </div>
                </div>
            </div>

            {/* 3. XAVFSIZLIK SOZLAMALARI */}
            <div className="mb-6">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Xavfsizlik</h3>
                <div className="bg-[#141e3c] rounded-2xl overflow-hidden border border-white/5">
                    
                    {/* PIN KOD */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-lg"><Lock size={18} className="text-[#00d4ff]"/></div>
                                <span className="text-white text-sm font-bold">PIN Kod bilan kirish</span>
                            </div>
                            {/* Toggle Switch */}
                            <div className="relative inline-block w-10 h-6 align-middle select-none">
                                <input type="checkbox" checked={!!pin} onChange={() => { if(pin) { setPin(''); onUpdateSettings({...data.settings, pinCode: null}); } else { setPin('0000'); onUpdateSettings({...data.settings, pinCode: '0000'}); } }} className="hidden"/>
                                <div className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${pin ? 'bg-[#00d4ff]' : 'bg-gray-600'}`} onClick={() => { if(pin) { setPin(''); onUpdateSettings({...data.settings, pinCode: null}); } else { setPin('0000'); onUpdateSettings({...data.settings, pinCode: '0000'}); } }}></div>
                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${pin ? 'left-5' : 'left-1'}`}></div>
                            </div>
                        </div>
                        {pin && (
                            <input 
                                type="number" 
                                placeholder="Yangi PIN (4 ta raqam)" 
                                value={pin} 
                                onChange={e => { 
                                    const val = e.target.value; 
                                    if(val.length <= 4) { setPin(val); if(val.length === 4) onUpdateSettings({...data.settings, pinCode: val}); } 
                                }} 
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl text-center tracking-[8px] font-mono outline-none border border-white/10 focus:border-[#00d4ff]"
                            />
                        )}
                    </div>

                    {/* BARMOQ IZI */}
                    <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg"><Fingerprint size={18} className="text-[#ff3366]"/></div>
                            <span className="text-white text-sm font-bold">Barmoq izi skaneri</span>
                        </div>
                        <button onClick={() => { setBiometrics(!biometrics); onUpdateSettings({...data.settings, useBiometrics: !biometrics}); }} 
                            className={`w-10 h-6 rounded-full relative transition-colors ${biometrics ? 'bg-[#ff3366]' : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${biometrics ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* OGOHLANTIRISH */}
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                <Shield className="text-yellow-500 shrink-0" size={20}/>
                <p className="text-yellow-500 text-xs leading-relaxed"><b>Eslatma:</b> Dasturni yangilashda eskisini o'chirib tashlashga to'g'ri kelyapti. Ma'lumotlaringizni ehtiyot qiling.</p>
            </div>
            
            <div className="h-10"></div>
        </div>
    )
}

// --- LOCK SCREEN (QULF OYNASI) ---
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
  
  // Faqat pinCode null bo'lmasa qulflaymiz
  const [isLocked, setIsLocked] = useState(!!(data.settings?.pinCode && data.settings.pinCode.length === 4));

  // Modallar
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  const [statsFilter, setStatsFilter] = useState<FilterState | null>(null);

  useEffect(() => { saveData(data); }, [data]);

  // Back Button Logic
  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      if (isLocked) return; // Qulflangan bo'lsa hech narsa qilma
      
      // Modallar ochiq bo'lsa yopish
      if (isTxModalOpen || isWalletModalOpen || detailTx || contextMenu) {
         setIsTxModalOpen(false); setIsWalletModalOpen(false); setDetailTx(null); setContextMenu(null);
         return;
      }
      // Tarix bo'yicha orqaga
      if (historyStack.length > 0) {
         const prev = historyStack[historyStack.length - 1];
         setHistoryStack(p => p.slice(0, -1)); setActiveTab(prev);
         return;
      }
      // Uyga qaytish
      if (activeTab !== 'home') { setActiveTab('home'); return; }
      
      // Ilovadan chiqish
      CapacitorApp.exitApp();
    });
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab, isLocked]);

  // --- HANDLERS ---
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
     if(!confirm("Haqiqatan ham bu amalni o'chirmoqchimisiz?")) return; // TASDIQLASH
     const tx = data.transactions.find(t => t.id === id);
     if(!tx) return;
     const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w);
     setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newW });
     setContextMenu(null); setDetailTx(null);
  };

  const handleDeleteWallet = (id: string) => {
      if(data.wallets.length <= 1) return;
      if(!confirm("Hamyonni o'chirsangiz, barcha tarixiy ma'lumotlar yo'qoladi. Rozimisiz?")) return; // TASDIQLASH
      setData({ ...data, wallets: data.wallets.filter(w => w.id !== id), transactions: data.transactions.filter(t => t.walletId !== id) });
      setContextMenu(null);
  };

  const handleJumpToFilter = (filter: FilterState) => {
    setStatsFilter(filter); setDetailTx(null); setActiveTab('stats');
  };

  // --- RENDER ---

  // 1. Agar qulflangan bo'lsa
  if (isLocked && data.settings?.pinCode) {
      return <LockScreen correctPin={data.settings.pinCode} onUnlock={() => setIsLocked(false)} />;
  }

  // 2. Asosiy Ilova
  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0e17] font-['Plus_Jakarta_Sans'] select-none text-[#e0e0ff]" onClick={() => setContextMenu(null)}>
      
      {/* Content Area */}
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

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl pb-5 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center px-6">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <Home size={24}/>
           </button>
           
           <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <BarChart2 size={24}/>
           </button>
           
           {/* Add Button */}
           <div className="relative -top-7">
              <button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/40 text-[#00d4ff] flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.3)] active:scale-95 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           
           {/* Profile Button */}
           <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <User size={24}/>
           </button>
           
           {/* AI Button */}
           <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
               <Sparkles size={24}/>
           </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Context Menu */}
      {contextMenu && (
          <div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); } if(contextMenu.type === 'wallet') { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } setContextMenu(null); }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">✏️ Tahrirlash</button>
              <div className="h-[1px] bg-white/5 my-1"></div>
              <button onClick={() => { if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); else handleDeleteWallet(contextMenu.item.id); }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">🗑️ O'chirish</button>
          </div>
      )}

      {/* Wallet Modal */}
      <WalletModal isOpen={isWalletModalOpen} onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }} onSave={handleWalletSave} initialData={editingWallet} />
      
      {/* Transaction Modal (Add/Edit) */}
      <TransactionModal 
          isOpen={isTxModalOpe