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

  const handleAddTransaction = (transaction: {
    amount: number;
    categoryId: string;
    walletId: string;
    type: TransactionType;
    date: string;
    note?: string;
  }) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...transaction,
    };

    const wallet = data.wallets.find((w) => w.id === transaction.walletId);
    if (wallet) {
      const updatedWallets = data.wallets.map((w) => {
        if (w.id === transaction.walletId) {
          return {
            ...w,
            balance:
              transaction.type === 'income'
                ? w.balance + transaction.amount
                : w.balance - transaction.amount,
          };
        }
        return w;
      });

      setData({
        ...data,
        transactions: [...data.transactions, newTransaction],
        wallets: updatedWallets,
      });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = data.transactions.find((t) => t.id === id);
    if (!transaction) return;

    if (confirm('Bu tranzaksiyani o\'chirmoqchimisiz?')) {
      const updatedWallets = data.wallets.map((w) => {
        if (w.id === transaction.walletId) {
          return {
            ...w,
            balance:
              transaction.type === 'income'
                ? w.balance - transaction.amount
                : w.balance + transaction.amount,
          };
        }
        return w;
      });

      setData({
        ...data,
        transactions: data.transactions.filter((t) => t.id !== id),
        wallets: updatedWallets,
      });
    }
  };

  const handleApiKeyChange = (key: string) => {
    setData({
      ...data,
      settings: { ...data.settings, apiKey: key },
    });
  };

  const handleDataChange = () => {
    setData(loadData());
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            wallets={data.wallets}
            transactions={data.transactions}
            categories={data.categories}
          />
        );
      case 'history':
        return (
          <HistoryPage
            transactions={data.transactions}
            categories={data.categories}
            wallets={data.wallets}
            onDelete={handleDeleteTransaction}
          />
        );
      case 'stats':
        return (
          <StatsPage transactions={data.transactions} categories={data.categories} />
        );
      case 'ai':
        return (
          <AIPage
            categories={data.categories}
            wallets={data.wallets}
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            apiKey={data.settings.apiKey}
            onApiKeyChange={handleApiKeyChange}
            onDataChange={handleDataChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {renderContent()}

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all z-40"
      >
        <Plus size={28} className="text-white" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 pb-safe">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full active:bg-gray-700 transition-colors ${
              activeTab === 'home' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Asosiy</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center flex-1 h-full active:bg-gray-700 transition-colors ${
              activeTab === 'history' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <History size={24} />
            <span className="text-xs mt-1">Tarix</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center flex-1 h-full active:bg-gray-700 transition-colors ${
              activeTab === 'stats' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-2 h-2 bg-current rounded-full"></div>
            </div>
            <span className="text-xs mt-1">Statistika</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center justify-center flex-1 h-full active:bg-gray-700 transition-colors ${
              activeTab === 'ai' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <Sparkles size={24} />
            <span className="text-xs mt-1">AI</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 h-full active:bg-gray-700 transition-colors ${
              activeTab === 'settings' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Sozlamalar</span>
          </button>
        </div>
      </nav>

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
