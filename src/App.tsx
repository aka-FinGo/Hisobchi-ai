import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, PieChart, Sparkles, User, Lock, Trash2, LogOut } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

// Profil sahifasini shu yerda kichik komponent qilib yozib ketaman (alohida fayl shart emas)
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    const [pin, setPin] = useState(data.settings.pinCode || '');
    const [name, setName] = useState(data.settings.userName || '');
    const colors = ['#00d4ff', '#ff3366', '#bb86fc', '#00ff9d', '#ffbf00'];

    return (
        <div className="p-6 pt-10 animate-slideUp pb-32">
            <h2 className="text-2xl font-bold text-white mb-8">Profil Sozlamalari</h2>
            
            {/* Ism */}
            <div className="mb-6">
                <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Foydalanuvchi Ismi</label>
                <input value={name} onChange={e => { setName(e.target.value); onUpdateSettings({...data.settings, userName: e.target.value}) }} className="w-full bg-[#141e3c] text-white p-4 rounded-xl border border-white/10 outline-none"/>
            </div>

            {/* Rang */}
            <div className="mb-6">
                <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Dastur Rangi</label>
                <div className="flex gap-3">
                    {colors.map(c => (
                        <button key={c} onClick={() => onUpdateSettings({...data.settings, themeColor: c})} 
                            className={`w-10 h-10 rounded-full border-2 ${data.settings.themeColor === c ? 'border-white scale-110' : 'border-transparent'}`} 
                            style={{ background: c }}
                        />
                    ))}
                </div>
            </div>

            {/* PIN Kod */}
            <div className="mb-6">
                <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Kirish Paroli (PIN)</label>
                <input type="number" placeholder="PIN o'rnatilmagan" value={pin} onChange={e => { 
                    const val = e.target.value;
                    setPin(val);
                    onUpdateSettings({...data.settings, pinCode: val.length > 0 ? val : null}) 
                }} className="w-full bg-[#141e3c] text-white p-4 rounded-xl border border-white/10 outline-none tracking-[5px] font-mono"/>
                <p className="text-[10px] text-gray-500 mt-2">PIN kodni o'chirish uchun maydonni tozalang.</p>
            </div>

            {/* 3D Effekt */}
            <div className="mb-6 flex justify-between items-center bg-[#141e3c] p-4 rounded-xl border border-white/10">
                <span className="text-white font-bold text-sm">3D Effektlar</span>
                <button onClick={() => onUpdateSettings({...data.settings, enable3D: !data.settings.enable3D})} 
                    className={`w-12 h-6 rounded-full relative transition-colors ${data.settings.enable3D ? 'bg-[#00d4ff]' : 'bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.settings.enable3D ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>
            
            <div className="mt-10 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-500 text-xs">⚠️ <b>Eslatma:</b> Dasturni yangilashda eskisini o'chirib tashlashga to'g'ri kelyapti. Buning sababi - Android xavfsizlik tizimi har bir yangi versiyani bitta "imzo" bilan talab qiladi. GitHub serveri har safar yangi imzo yaratgani uchun, telefoningiz "Bu boshqa dastur" deb o'ylaydi. Bu vaqtinchalik holat.</p>
            </div>
        </div>
    )
}

// LOCK SCREEN (PIN Kiritish oynasi)
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
                <button onClick={() => setInput(input.slice(0,-1))} className="w-16 h-16 rounded-full text-gray-500 flex items-center justify-center active:scale-90"><ArrowLeft/></button>
            </div>
        </div>
    )
}

type TabType = 'home' | 'stats' | 'budget' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [historyStack, setHistoryStack] = useState<TabType[]>([]);
  const [isLocked, setIsLocked] = useState(!!data.settings?.pinCode); // Lock state

  // Modallar
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  const [statsFilter, setStatsFilter] = useState<FilterState | null>(null);

  useEffect(() => { saveData(data); }, [data]);

  // Back Button
  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      if (isLocked) return; // Qulflangan bo'lsa orqaga qaytmaydi
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

  // Handlers
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

  // TASDIQLASH BILAN O'CHIRISH
  const handleDeleteTx = (id: string) => {
     if(!confirm("Ushbu amalni o'chirib tashlamoqchimisiz?")) return; // TASDIQLASH
     const tx = data.transactions.find(t => t.id === id);
     if(!tx) return;
     const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w);
     setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newW });
     setContextMenu(null); setDetailTx(null);
  };

  const handleDeleteWallet = (id: string) => {
      if(data.wallets.length <= 1) return;
      if(!confirm("Hamyonni o'chirsangiz, unga bog'liq barcha tarix o'chib ketadi. Rozimisiz?")) return; // TASDIQLASH
      setData({ ...data, wallets: data.wallets.filter(w => w.id !== id), transactions: data.transactions.filter(t => t.walletId !== id) });
      setContextMenu(null);
  };

  const handleJumpToFilter = (filter: FilterState) => {
    setStatsFilter(filter); setDetailTx(null); setActiveTab('stats');
  };

  // Lock Screen
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
          {activeTab === 'stats' && <StatsPage data={data} initialFilter={statsFilter} onClearFilter={() => setStatsFilter(null)} onTxClick={setDetailTx} />}
          {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />}
          
          {/* PROFIL SAHIFASI */}
          {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={(s) => setData({...data, settings: s})} />}
        </div>
      </div>

      {/* MENU BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl pb-5 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center px-6">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Home size={24}/></button>
           <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><BarChart2 size={24}/></button>
           <div className="relative -top-7">
              <button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/40 text-[#00d4ff] flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.3)] active:scale-95 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           {/* Budget o'rniga Profil qo'ydim, chunki budget hali chala */}
           <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><User size={24}/></button>
           <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Sparkles size={24}/></button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
          <div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); } if(contextMenu.type === 'wallet') { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } setContextMenu(null); }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">✏️ Tahrirlash</button>
              <div className="h-[1px] bg-white/5 my-1"></div>
              <button onClick={() => { if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); else handleDeleteWallet(contextMenu.item.id); }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">🗑️ O'chirish</button>
          </div>
      )}

      {/* Modals */}
      <WalletModal isOpen={isWalletModalOpen} onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }} onSave={handleWalletSave} initialData={editingWallet} />
      
      {/* Transaction Modalga settings va allTransactions ni uzatamiz */}
      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        onSave={handleTransactionSave} 
        categories={data.categories} 
        wallets={data.wallets} 
        allTransactions={data.transactions} // Tarix uchun
        initialData={editingTx} 
        onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} 
        onUpdateCategories={(u) => setData({...data, categories: u})}
        settings={data.settings} // Rang uchun
      />
      
      <TransactionDetailModal isOpen={!!detailTx} onClose={() => setDetailTx(null)} transaction={detailTx} category={data.categories.find(c => c.id === detailTx?.categoryId)} wallet={data.wallets.find(w => w.id === detailTx?.walletId)} onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }} onDelete={handleDeleteTx} onFilter={handleJumpToFilter} />
    </div>
  );
}
export default App;
