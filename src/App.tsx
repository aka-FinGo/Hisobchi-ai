import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, History, Plus, Sparkles, Settings } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction } from './types';
import HomePage from './components/HomePage';
import HistoryPage from './components/HistoryPage';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';
import SettingsPage from './components/SettingsPage';
import TransactionModal from './components/TransactionModal';

// Types va boshqa kodlar o'zgarishsiz qoladi
type TabType = 'home' | 'history' | 'stats' | 'ai' | 'settings';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Back button logikasi
  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (isModalOpen) {
        setIsModalOpen(false);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else {
        CapacitorApp.exitApp();
      }
    });
  }, [isModalOpen, activeTab]);

  useEffect(() => { saveData(data); }, [data]);

  const refreshData = () => { setData(loadData()); };

  const handleSaveTransaction = (tData: any) => {
    let newTxList = [...data.transactions];
    let newWallets = [...data.wallets];

    if (editingTransaction) {
      const oldWallet = newWallets.find(w => w.id === editingTransaction.walletId);
      if (oldWallet) {
        oldWallet.balance -= (editingTransaction.type === 'income' ? editingTransaction.amount : -editingTransaction.amount);
      }
      newTxList = newTxList.filter(t => t.id !== editingTransaction.id);
    }

    const newTx: Transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now().toString(),
      ...tData
    };

    const wallet = newWallets.find(w => w.id === tData.walletId);
    if (wallet) {
      wallet.balance += (tData.type === 'income' ? tData.amount : -tData.amount);
    }

    setData({ ...data, wallets: newWallets, transactions: [newTx, ...newTxList] });
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    if (!tx) return;
    const newWallets = data.wallets.map(w => {
      if (w.id === tx.walletId) {
        const amount = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...w, balance: w.balance + amount };
      }
      return w;
    });
    setData({ ...data, wallets: newWallets, transactions: data.transactions.filter(t => t.id !== id) });
  };

  const handleEditClick = (id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    if (tx) {
      setEditingTransaction(tx);
      setIsModalOpen(true);
    }
  };

  return (
    // ASOSIY O'ZGARISH SHU YERDA: Flex Layout
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white font-sans overflow-hidden">
      
      {/* 1. SCROLL QISMI (CONTENT) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide w-full relative">
        {activeTab === 'home' && <HomePage wallets={data.wallets} transactions={data.transactions} categories={data.categories} />}
        {activeTab === 'history' && <HistoryPage transactions={data.transactions} categories={data.categories} wallets={data.wallets} onDelete={handleDeleteTransaction} onEdit={handleEditClick} />}
        {activeTab === 'stats' && <StatsPage transactions={data.transactions} categories={data.categories} />}
        // App.tsx ichida
{activeTab === 'ai' && (
  <AIPage 
    data={data} // <-- YANGI: Butun ma'lumotlar bazasini beramiz
    onAddTransaction={(tx) => {
      const newTx = { ...tx, id: Date.now().toString() };
      setData(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTx]
      }));
      // Optional: Muvaffaqiyatli qo'shilganda vibratsiya yoki tovush
    }} 
  />
)}


      {/* 2. MENU QISMI (QOTIRILGAN) */}
      <div className="flex-none w-full bg-gray-900 border-t border-gray-800 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 px-2 relative">
          
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Asosiy</span>
          </button>

          <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'}`}>
            <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Tarix</span>
          </button>

          {/* KATTA TUGMA (Navbardan tashqariga chiqib turadi) */}
          <div className="relative -top-5">
            <button
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-gray-900 active:scale-90 transition-transform"
            >
              <Plus size={32} />
            </button>
          </div>

          <button onClick={() => setActiveTab('ai')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'ai' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Sparkles size={24} strokeWidth={activeTab === 'ai' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">AI</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Sozlama</span>
          </button>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTransaction}
      />
    </div>
  );
}

export default App;
