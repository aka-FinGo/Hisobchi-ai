import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, PieChart, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet } from './types';

// Komponentlar
import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

type TabType = 'home' | 'stats' | 'budget' | 'ai' | 'profile';

function App() {
  // --- STATE (HOLATLAR) ---
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [historyStack, setHistoryStack] = useState<TabType[]>([]); // Navigatsiya tarixi

  // Modallar ochiq/yopiqligi
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // Tahrirlash uchun ma'lumotlar
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  
  // Batafsil ko'rish va Menyu
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);

  // --- EFFECT: Ma'lumotni saqlash ---
  useEffect(() => {
    saveData(data);
  }, [data]);

  // --- EFFECT: Back Button (Android uchun maxsus va xavfsiz) ---
  useEffect(() => {
    const handleBackButton = () => {
      // 1. Agar Modal, Menyu yoki Detal ochiq bo'lsa -> Yopamiz
      if (isTxModalOpen || isWalletModalOpen || detailTx || contextMenu) {
         setIsTxModalOpen(false);
         setIsWalletModalOpen(false);
         setDetailTx(null);
         setContextMenu(null);
         return;
      }

      // 2. Agar tarixda oldingi sahifa bo'lsa -> O'shanga qaytamiz
      if (historyStack.length > 0) {
         const prevTab = historyStack[historyStack.length - 1];
         setHistoryStack(prev => prev.slice(0, -1)); // Tarixdan o'chiramiz
         setActiveTab(prevTab);
         return;
      }

      // 3. Agar Bosh sahifada bo'lmasa -> Bosh sahifaga o'tamiz
      if (activeTab !== 'home') {
         setActiveTab('home');
         return;
      }

      // 4. Agar Bosh sahifada bo'lsa -> Dasturdan chiqamiz
      try {
        CapacitorApp.exitApp();
      } catch (error) {
        console.log("Web versiyada chiqish imkonsiz (bu normal holat).");
      }
    };

    // Listener qo'shamiz (Xatolik bo'lmasligi uchun try-catch)
    let listener: any;
    try {
      listener = CapacitorApp.addListener('backButton', handleBackButton);
    } catch (e) {
      console.warn("Capacitor muhiti topilmadi.");
    }

    // Tozalash
    return () => {
      if (listener) listener.remove();
    };
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab]);


  // --- FUNKSIYALAR ---

  // 1. Yangilash (Pull to Refresh)
  const refreshData = () => {
    const freshData = loadData(); // Xotiradan qayta yuklash
    setData({ ...freshData }); // State ni yangilash
  };

  // 2. Hamyonni Saqlash (Yangi yoki Tahrir)
  const handleWalletSave = (wallet: Wallet) => {
    if (editingWallet) {
      // Tahrirlash: Eskisini topib almashtiramiz
      const updatedWallets = data.wallets.map(w => w.id === wallet.id ? wallet : w);
      setData({ ...data, wallets: updatedWallets });
    } else {
      // Yangi qo'shish
      setData({ ...data, wallets: [...data.wallets, wallet] });
    }
    // Yopish va tozalash
    setIsWalletModalOpen(false);
    setEditingWallet(null);
  };

  // 3. Tranzaksiyani Saqlash (Mantiqiy hisob-kitob bilan)
  const handleTransactionSave = (txData: Transaction) => {
    let newTransactions = [...data.transactions];
    let newWallets = [...data.wallets];

    // Agar Tahrirlanayotgan bo'lsa:
    if (editingTx) {
       const oldTx = data.transactions.find(t => t.id === editingTx.id);
       if (oldTx) {
          // Eski ta'sirni bekor qilamiz (Reverse)
          newWallets = newWallets.map(w => {
            if (w.id === oldTx.walletId) {
               const reversal = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
               return { ...w, balance: w.balance + reversal };
            }
            return w;
          });
          // Ro'yxatdan eskisini o'chiramiz
          newTransactions = newTransactions.filter(t => t.id !== editingTx.id);
       }
    }

    // Yangi tranzaksiyani qo'shamiz
    const finalTx = { ...txData, id: txData.id || Date.now().toString() };
    newTransactions.push(finalTx);

    // Yangi ta'sirni hamyonga yozamiz
    newWallets = newWallets.map(w => {
      if (w.id === finalTx.walletId) {
        const effect = finalTx.type === 'income' ? finalTx.amount : -finalTx.amount;
        return { ...w, balance: w.balance + effect };
      }
      return w;
    });

    setData({ ...data, transactions: newTransactions, wallets: newWallets });
    setIsTxModalOpen(false);
    setEditingTx(null);
    setDetailTx(null); // Agar detal ochiq bo'lsa yopamiz
  };

  // 4. Tranzaksiyani O'chirish
  const handleDeleteTx = (id: string) => {
     const tx = data.transactions.find(t => t.id === id);
     if (!tx) return;

     // Balansni qaytarish
     const newWallets = data.wallets.map(w => {
       if (w.id === tx.walletId) {
         const reversal = tx.type === 'income' ? -tx.amount : tx.amount;
         return { ...w, balance: w.balance + reversal };
       }
       return w;
     });

     setData({ 
       ...data, 
       transactions: data.transactions.filter(t => t.id !== id), 
       wallets: newWallets 
     });
     setContextMenu(null);
     setDetailTx(null);
  };

  // 5. Hamyonni O'chirish
  const handleDeleteWallet = (id: string) => {
      if (data.wallets.length <= 1) {
        alert("Xatolik: Kamida bitta hamyon qolishi shart!");
        return;
      }
      if (confirm("Hamyon va uning barcha tranzaksiyalari o'chiriladi. Rozimisiz?")) {
        setData({ 
          ...data, 
          wallets: data.wallets.filter(w => w.id !== id),
          transactions: data.transactions.filter(t => t.walletId !== id)
        });
        setContextMenu(null);
      }
  };

  // 6. Navigatsiya
  const navigateTo = (page: TabType) => {
    if (page !== activeTab) {
      setHistoryStack(prev => [...prev, activeTab]); // Tarixga yozish
      setActiveTab(page);
    }
  };

  return (
    // Context Menu yopilishi uchun asosiy divga onClick beramiz
    <div 
      className="flex flex-col h-full bg-[#0a0e17] font-['Plus_Jakarta_Sans'] select-none text-[#e0e0ff]" 
      onClick={() => setContextMenu(null)}
    >
      
      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                data={data} 
                onNavigate={(page) => navigateTo(page as TabType)}
                onTransactionClick={(tx) => setDetailTx(tx)}
                onContextMenu={(e, item, type) => {
                    // Menyuni sichqoncha turgan joyda ochish
                    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
                }}
                onAddWallet={() => { 
                    setEditingWallet(null); // Yangi hamyon rejimi
                    setIsWalletModalOpen(true); 
                }}
                onRefresh={refreshData} // Pull-to-refresh uchun
            />
        )}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
        {/* Budget va Profile sahifalari uchun joy */}
        {activeTab === 'budget' && <div className="p-10 text-center">Budjet bo'limi</div>}
      </div>

      {/* --- FIXED MENU BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md pb-4 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center px-6">
           {/* Home */}
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
             <Home size={24}/>
           </button>
           
           {/* Stats */}
           <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
             <BarChart2 size={24}/>
           </button>
           
           {/* PLUS BUTTON (Floating) */}
           <div className="relative -top-6">
              <button 
                onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} 
                className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/50 text-[#00d4ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 transition-transform"
              >
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           
           {/* Budget */}
           <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center ${activeTab === 'budget' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
             <PieChart size={24}/>
           </button>
           
           {/* AI */}
           <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}>
             <Sparkles size={24}/>
           </button>
        </div>
      </div>

      {/* --- CONTEXT MENU (Tahrirlash / O'chirish) --- */}
      {contextMenu && (
          <div 
            className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" 
            style={{ 
              top: contextMenu.y - 100, 
              left: Math.min(contextMenu.x - 20, window.innerWidth - 180) 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
              <button onClick={() => { 
                  if(contextMenu.type === 'tx') { 
                      setEditingTx(contextMenu.item); 
                      setIsTxModalOpen(true); 
                  }
                  if(contextMenu.type === 'wallet') { 
                      setEditingWallet(contextMenu.item); // MUHIM: Tahrirlash uchun ma'lumotni yuklash
                      setIsWalletModalOpen(true); 
                  }
                  setContextMenu(null); 
              }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl transition-colors">
                ✏️ Tahrirlash
              </button>
              
              <div className="h-[1px] bg-white/5 my-1"></div>
              
              <button onClick={() => { 
                  if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); 
                  else handleDeleteWallet(contextMenu.item.id); 
              }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl transition-colors">
                🗑️ O'chirish
              </button>
          </div>
      )}

      {/* --- MODALS --- */}
      
      {/* 1. Wallet Modal */}
      <WalletModal 
         isOpen={isWalletModalOpen} 
         onClose={() => { 
             setIsWalletModalOpen(false); 
             setEditingWallet(null); // Yopilganda tozalash
         }} 
         onSave={handleWalletSave} 
         initialData={editingWallet} // Tahrirlash ma'lumoti
      />
      
      {/* 2. Transaction Modal */}
      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        onSave={handleTransactionSave} 
        categories={data.categories} 
        wallets={data.wallets} 
        initialData={editingTx} 
        onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} 
        onUpdateCategories={(u) => setData({...data, categories: u})} 
      />
      
      {/* 3. Detail Modal */}
      <TransactionDetailModal 
        isOpen={!!detailTx} 
        onClose={() => setDetailTx(null)} 
        transaction={detailTx} 
        category={data.categories.find(c => c.id === detailTx?.categoryId)} 
        wallet={data.wallets.find(w => w.id === detailTx?.walletId)} 
        onEdit={(tx) => { 
            setDetailTx(null); 
            setEditingTx(tx); 
            setIsTxModalOpen(true); 
        }} 
        onDelete={handleDeleteTx} 
      />

    </div>
  );
}

export default App;
