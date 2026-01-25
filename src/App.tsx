import { useState, useEffect } from 'react';
import { Home, History, Plus, Sparkles, Settings } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, TransactionType } from './types';
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

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Ma'lumot yangilanganda App ni qayta render qilish uchun
  const refreshData = () => {
    setData(loadData());
  };

  const handleAddTransaction = (transaction: any) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...transaction,
    };

    // Balansni yangilash
    const updatedWallets = data.wallets.map((w) => {
      if (w.id === transaction.walletId) {
        const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        return { ...w, balance: w.balance + amount };
      }
      return w;
    });

    setData({
      ...data,
      wallets: updatedWallets,
      transactions: [newTransaction, ...data.transactions],
    });
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = data.transactions.find((t) => t.id === id);
    if (!transaction) return;

    // Balansni orqaga qaytarish
    const updatedWallets = data.wallets.map((w) => {
      if (w.id === transaction.walletId) {
        const amount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        return { ...w, balance: w.balance + amount };
      }
      return w;
    });

    setData({
      ...data,
      wallets: updatedWallets,
      transactions: data.transactions.filter((t) => t.id !== id),
    });
  };

  return (
    <div className="h-full bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      <div className="h-full overflow-y-auto pb-20 scrollbar-hide">
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
            onDelete={handleDeleteTransaction}
          />
        )}
        {activeTab === 'stats' && (
          <StatsPage transactions={data.transactions} categories={data.categories} />
        )}
        {activeTab === 'ai' && (
          <AIPage 
            categories={data.categories} 
            wallets={data.wallets} 
            onAddTransaction={handleAddTransaction} 
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage onDataChange={refreshData} />
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-gray-900/90 backdrop-blur-lg border-t border-gray-800 pb-safe z-50">
        <nav className="flex justify-around items-center h-16 px-2 relative">
          
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Asosiy</span>
          </button>

          <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center ${activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'}`}>
            <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Tarix</span>
          </button>

          {/* O'rtadagi KATTA FAB Tugma */}
          <div className="relative -top-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-gray-900 active:scale-90 transition-transform"
            >
              <Plus size={32} />
            </button>
          </div>

          <button onClick={() => setActiveTab('ai')} className={`flex-1 flex flex-col items-center ${activeTab === 'ai' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Sparkles size={24} strokeWidth={activeTab === 'ai' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">AI</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}>
            <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Sozlama</span>
          </button>
        </nav>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
        categories={data.categories}
        wallets={data.wallets}
      />
    </div>
  );
}

export default App;
