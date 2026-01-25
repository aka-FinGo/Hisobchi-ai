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

      {/* Pastki Navigatsiya (Bottom Bar) */}
      <div className="bg-gray-900/95 backdrop-blur border-t border-gray-800 pb-safe pt-2 px-6 fixed bottom-0 left-0 right-0 z-50">
        <div className="flex justify-between items-end pb-2">
          
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Asosiy</span>
          </button>

          <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'stats' ? 'text-blue-500' : 'text-gray-500'}`}>
            <History size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Statistika</span>
          </button>

          {/* O'rtadagi Katta Plyus Tugmasi */}
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

          <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Settings size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Tarix</span>
          </button>
          
          {/* Sozlamalar History iconiga o'xshab qolgan ekan, to'g'irlab qo'ydim: Tarix -> HistoryPage, Sozlamalar -> SettingsPage */}
           <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center py-2 ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Sozlama</span>
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
