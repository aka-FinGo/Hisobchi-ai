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

type TabType = 'home' | 'history' | 'stats' | 'ai' | 'settings';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Android Back Button logikasi
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

  // Ma'lumotlar o'zgarganda saqlash
  useEffect(() => {
    saveData(data);
  }, [data]);

  const handleTransactionSave = (txData: any) => {
    const newTx = {
      ...txData,
      id: editingTransaction ? editingTransaction.id : Date.now().toString(),
    };

    let updatedTransactions;
    if (editingTransaction) {
      updatedTransactions = data.transactions.map((t) =>
        t.id === editingTransaction.id ? newTx : t
      );
    } else {
      updatedTransactions = [...data.transactions, newTx];
    }

    // Balanslarni yangilash
    const updatedWallets = data.wallets.map((w) => {
      if (w.id === txData.walletId) {
        const amountDiff = editingTransaction
          ? newTx.amount - editingTransaction.amount // Tahrirlashdagi farq
          : newTx.amount;
        
        const newBalance = txData.type === 'income' 
          ? w.balance + amountDiff 
          : w.balance - amountDiff;
          
        return { ...w, balance: newBalance };
      }
      return w;
    });

    setData({
      ...data,
      transactions: updatedTransactions,
      wallets: updatedWallets,
    });
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id: string) => {
    const tx = data.transactions.find((t) => t.id === id);
    if (!tx) return;

    const updatedWallets = data.wallets.map((w) => {
      if (w.id === tx.walletId) {
        return {
          ...w,
          balance: tx.type === 'income' ? w.balance - tx.amount : w.balance + tx.amount,
        };
      }
      return w;
    });

    setData({
      ...data,
      transactions: data.transactions.filter((t) => t.id !== id),
      wallets: updatedWallets,
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Asosiy Kontent */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'home' && (
          <HomePage
            wallets={data.wallets}
            transactions={data.transactions}
            categories={data.categories}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage
            transactions={data.transactions}
            categories={data.categories}
            wallets={data.wallets}
            onDelete={handleDelete}
            onEdit={(id) => {
              const tx = data.transactions.find((t) => t.id === id);
              if (tx) {
                setEditingTransaction(tx);
                setIsModalOpen(true);
              }
            }}
          />
        )}
        {activeTab === 'stats' && (
          <StatsPage transactions={data.transactions} categories={data.categories} />
        )}
        {activeTab === 'ai' && (
          <AIPage 
            data={data}
            onAddTransaction={(tx) => handleTransactionSave(tx)}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            data={data}
            onDataChange={() => setData(loadData())}
          />
        )}
      </div>

            {/* YANGI: Floating Bottom Navbar (Suzib yuruvchi menyu) */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="glass-card rounded-3xl p-2 px-6 flex justify-between items-center shadow-2xl shadow-black/50">
          
          <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 translate-y-[-10px]' : 'text-gray-400 hover:text-white'}`}>
            <Home size={22} />
          </button>

          <button onClick={() => setActiveTab('stats')} className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 translate-y-[-10px]' : 'text-gray-400 hover:text-white'}`}>
            <History size={22} />
          </button>

          {/* Markaziy AI/Plus tugmasi */}
          <button
            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
            className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white flex items-center justify-center shadow-lg shadow-rose-500/40 transform -translate-y-6 border-[6px] border-[#0f172a] active:scale-90 transition-transform"
          >
            <Plus size={28} strokeWidth={3} />
          </button>

          <button onClick={() => setActiveTab('ai')} className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 translate-y-[-10px]' : 'text-gray-400 hover:text-white'}`}>
            <Sparkles size={22} />
          </button>
          
          <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 translate-y-[-10px]' : 'text-gray-400 hover:text-white'}`}>
            <Settings size={22} />
          </button>
        </div>
      </div>


      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={handleTransactionSave}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTransaction}
      />
    </div>
  );
}

export default App;
