import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app'; // Back button uchun
import { Home, BarChart2, Plus, PieChart, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, Category } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage'; 

type TabType = 'home' | 'stats' | 'budget' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [historyStack, setHistoryStack] = useState<TabType[]>([]); // Tarix uchun

  // Modallar
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  
  // Wallet Edit
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);

  // --- 1. ANDROID BACK BUTTON MANTIQI ---
  useEffect(() => {
    let lastBackTime = 0;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const now = Date.now();

      // 1. Agar Modal yoki Context Menu ochiq bo'lsa -> Yopamiz
      if (isTxModalOpen || isWalletModalOpen || detailTx || contextMenu) {
         setIsTxModalOpen(false);
         setIsWalletModalOpen(false);
         setDetailTx(null);
         setContextMenu(null);
         return;
      }

      // 2. Agar Tarixda sahifa bo'lsa -> Orqaga qaytamiz
      if (historyStack.length > 0) {
         const prevTab = historyStack[historyStack.length - 1];
         setHistoryStack(prev => prev.slice(0, -1)); // Stackdan olib tashlaymiz
         setActiveTab(prevTab);
         return;
      }

      // 3. Agar Bosh sahifada bo'lmasa -> Bosh sahifaga
      if (activeTab !== 'home') {
         setActiveTab('home');
         return;
      }

      // 4. Agar Home'da bo'lsa va 2 marta tez bosilsa -> Chiqish
      if (now - lastBackTime < 2000) {
         CapacitorApp.exitApp();
      } else {
         lastBackTime = now;
         // Bu yerda Toast chiqarish mumkin: "Chiqish uchun yana bosing"
         console.log("Press back again to exit");
      }
    });
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab]);

  // Tab o'zgarganda tarixga yozish
  const handleTabChange = (newTab: TabType) => {
     if (newTab !== activeTab) {
        setHistoryStack(prev => [...prev, activeTab]);
        setActiveTab(newTab);
     }
  };

  useEffect(() => { saveData(data); }, [data]);

  // --- MANTIQ: Hamyonni O'chirish ---
  const handleDeleteWallet = (id: string) => {
     if(data.wallets.length <= 1) { alert("Kamida bitta hamyon qolishi kerak!"); return; }
     if(confirm("Hamyon va uning barcha tranzaksiyalari o'chiriladi. Rozimisiz?")) {
        setData({
            ...data,
            wallets: data.wallets.filter(w => w.id !== id),
            transactions: data.transactions.filter(t => t.walletId !== id)
        });
        setContextMenu(null);
     }
  };

  // --- MANTIQ: Tranzaksiya Saqlash ---
  const handleTransactionSave = (txData: Transaction) => {
    let newTxList = [...data.transactions];
    let newWallets = [...data.wallets];

    if (editingTx) {
      const oldTx = data.transactions.find(t => t.id === editingTx.id);
      if (oldTx) {
        newWallets = newWallets.map(w => {
          if (w.id === oldTx.walletId) {
            const reversal = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            return { ...w, balance: w.balance + reversal };
          }
          return w;
        });
        newTxList = newTxList.filter(t => t.id !== editingTx.id);
      }
    }

    const finalTx = { ...txData, id: txData.id || Date.now().toString() };
    newTxList.push(finalTx);

    newWallets = newWallets.map(w => {
      if (w.id === finalTx.walletId) {
        const effect = finalTx.type === 'income' ? finalTx.amount : -finalTx.amount;
        return { ...w, balance: w.balance + effect };
      }
      return w;
    });

    setData({ ...data, transactions: newTxList, wallets: newWallets });
    setIsTxModalOpen(false); setEditingTx(null); setDetailTx(null);
  };

  const handleDeleteTx = (id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    if (!tx) return;
    const newWallets = data.wallets.map(w => {
      if (w.id === tx.walletId) {
        const reversal = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...w, balance: w.balance + reversal };
      }
      return w;
    });
    setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newWallets });
    setContextMenu(null); setDetailTx(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0f14] font-['Plus_Jakarta_Sans'] select-none text-[#cfd8dc]" onClick={() => setContextMenu(null)}>
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                data={data} 
                onNavigate={(page) => handleTabChange(page as TabType)}
                onTransactionClick={(tx) => setDetailTx(tx)}
                onContextMenu={(e, item, type) => {
                    e.preventDefault(); // Browser menu chiqmasligi uchun
                    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
                }}
                onAddWallet={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
            />
        )}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
      </div>

      {/* --- MENU BAR (Fixed & Background) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0f14]/90 backdrop-blur-md pb-4 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center px-6">
           <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00ffff]' : 'text-gray-600'}`}><Home size={24}/></button>
           <button onClick={() => handleTabChange('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00ffff]' : 'text-gray-600'}`}><BarChart2 size={24}/></button>
           
           <div className="relative -top-6">
              <button 
                onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} 
                className="w-16 h-16 rounded-full bg-[#161a22] border border-[#00ffff]/50 text-[#00ffff] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.4)] active:scale-95 transition-transform"
              >
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           
           <button onClick={() => handleTabChange('budget')} className={`flex flex-col items-center ${activeTab === 'budget' ? 'text-[#00ffff]' : 'text-gray-600'}`}><PieChart size={24}/></button>
           <button onClick={() => handleTabChange('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00ffff]' : 'text-gray-600'}`}><Sparkles size={24}/></button>
        </div>
      </div>

      {/* --- CONTEXT MENU (Tahrirlash / O'chirish) --- */}
      {contextMenu && (
          <div 
              className="absolute bg-[#161a22] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp"
              style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }}
              onClick={(e) => e.stopPropagation()}
          >
              <button onClick={() => { 
                  if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); }
                  if(contextMenu.type === 'wallet') { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } // Wallet Edit
                  setContextMenu(null);
              }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">
                 ✏️ Tahrirlash
              </button>
              
              <div className="h-[1px] bg-white/5 my-1"></div>
              
              <button onClick={() => {
                  if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id);
                  if(contextMenu.type === 'wallet') handleDeleteWallet(contextMenu.item.id); // Wallet Delete
              }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">
                 🗑️ O'chirish
              </button>
          </div>
      )}

      {/* --- MODALS --- */}
      <WalletModal 
         isOpen={isWalletModalOpen} 
         onClose={() => setIsWalletModalOpen(false)}
         onSave={(w) => {
             // Tahrirlash yoki Yangi
             if(editingWallet) {
                 setData({...data, wallets: data.wallets.map(old => old.id === w.id ? w : old)});
             } else {
                 setData({...data, wallets: [...data.wallets, w]});
             }
         }}
         initialData={editingWallet} // WalletModalga prop qo'shish kerak (pastda)
      />
      
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

      <TransactionDetailModal
        isOpen={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
        category={data.categories.find(c => c.id === detailTx?.categoryId)}
        wallet={data.wallets.find(w => w.id === detailTx?.walletId)}
        onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }}
        onDelete={handleDeleteTx}
      />
    </div>
  );
}

export default App;
