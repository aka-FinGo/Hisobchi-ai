import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, PieChart, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet } from './types';

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
  const [historyStack, setHistoryStack] = useState<TabType[]>([]);

  // Modallar
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // Tahrirlash uchun State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null); // MUHIM
  
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);

  useEffect(() => { saveData(data); }, [data]);

  // Back Button
  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
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
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab]);

  // --- HAMYON SAQLASH ---
  const handleWalletSave = (wallet: Wallet) => {
    if (editingWallet) {
      // Tahrirlash
      setData({ ...data, wallets: data.wallets.map(w => w.id === wallet.id ? wallet : w) });
    } else {
      // Yangi
      setData({ ...data, wallets: [...data.wallets, wallet] });
    }
    setIsWalletModalOpen(false);
    setEditingWallet(null);
  };

  // --- TRANZAKSIYA SAQLASH ---
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

  // O'chirish
  const handleDeleteTx = (id: string) => {
     const tx = data.transactions.find(t => t.id === id);
     if(!tx) return;
     const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w);
     setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newW });
     setContextMenu(null); setDetailTx(null);
  };

  const handleDeleteWallet = (id: string) => {
      if(data.wallets.length <= 1) return;
      setData({ ...data, wallets: data.wallets.filter(w => w.id !== id), transactions: data.transactions.filter(t => t.walletId !== id) });
      setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] font-['Plus_Jakarta_Sans'] select-none text-[#e0e0ff]" onClick={() => setContextMenu(null)}>
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                data={data} 
                onNavigate={(p) => { setHistoryStack(prev => [...prev, activeTab]); setActiveTab(p as any); }}
                onTransactionClick={setDetailTx}
                onContextMenu={(e, i, t) => setContextMenu({ x: e.clientX, y: e.clientY, item: i, type: t })}
                onAddWallet={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
            />
        )}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
      </div>

      {/* MENU BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md pb-4 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center px-6">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Home size={24}/></button>
           <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><BarChart2 size={24}/></button>
           <div className="relative -top-6">
              <button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/50 text-[#00d4ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center ${activeTab === 'budget' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><PieChart size={24}/></button>
           <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Sparkles size={24}/></button>
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
          <div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { 
                  // Tahrirlash bosilganda
                  if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); }
                  if(contextMenu.type === 'wallet') { 
                      setEditingWallet(contextMenu.item); // State yangilanadi
                      setIsWalletModalOpen(true); // Modal ochiladi
                  }
                  setContextMenu(null); 
              }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">✏️ Tahrirlash</button>
              
              <div className="h-[1px] bg-white/5 my-1"></div>
              
              <button onClick={() => { if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); else handleDeleteWallet(contextMenu.item.id); }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">🗑️ O'chirish</button>
          </div>
      )}

      {/* MODALLAR */}
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }} 
        onSave={handleWalletSave} 
        initialData={editingWallet} // MUHIM: Prop sifatida uzatildi
      />
      
      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSave={handleTransactionSave} categories={data.categories} wallets={data.wallets} initialData={editingTx} onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} onUpdateCategories={(u) => setData({...data, categories: u})} />
      
      <TransactionDetailModal isOpen={!!detailTx} onClose={() => setDetailTx(null)} transaction={detailTx} category={data.categories.find(c => c.id === detailTx?.categoryId)} wallet={data.wallets.find(w => w.id === detailTx?.walletId)} onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }} onDelete={handleDeleteTx} />
    </div>
  );
}

export default App;
