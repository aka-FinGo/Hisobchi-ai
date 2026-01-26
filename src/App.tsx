import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, Sparkles, User } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction } from './types';

// Komponentlarni import qilish
import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';
import ProfilePage from './components/SettingsPage'; // Profil va Sozlamalar hubi
import TransactionModal from './components/TransactionModal';

type TabType = 'home' | 'stats' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 1. Android/Capacitor Back Button Logikasi
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

  // 2. Ma'lumotlar o'zgarganda saqlash (Auto-save)
  useEffect(() => {
    saveData(data);
  }, [data]);

  // 3. Tranzaksiyani Saqlash / Tahrirlash
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

    // Balansni yangilash logikasi
    const updatedWallets = data.wallets.map((w) => {
      if (w.id === txData.walletId) {
        const amountDiff = editingTransaction
          ? newTx.amount - editingTransaction.amount
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

  // 4. Profil Hub buyruqlarini boshqarish (Action Manager)
  const handleProfileAction = (actionType: string) => {
    switch (actionType) {
      case 'edit-categories':
        // Bu yerda kategoriya tahrirlash panelini ochishing mumkin
        console.log("Kategoriyalar ochildi");
        break;
      case 'edit-ai':
        console.log("AI sozlamalari ochildi");
        break;
      case 'reset-data':
        if(confirm("DIQQAT! Barcha ma'lumotlar o'chiriladi. Rozimisiz?")) {
           localStorage.clear();
           window.location.reload();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      
      {/* Sahifalar (Tab Router) */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <HomePage data={data} />}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />}
        {activeTab === 'profile' && (
          <ProfilePage 
            data={data} 
            onDataChange={() => setData(loadData())}
            onAction={handleProfileAction} 
          />
        )}
      </div>

      {/* --- CYBER NEON BOTTOM BAR --- */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="glass-neon rounded-[30px] p-2 flex justify-between items-center relative">
          
          {/* Home */}
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'home' ? 'text-[#00f2ff] translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <Home size={22} className={activeTab === 'home' ? 'neon-text-blue' : ''} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Main</span>
          </button>

          {/* Stats */}
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'stats' ? 'text-[#bc13fe] translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <BarChart2 size={22} className={activeTab === 'stats' ? 'neon-text-purple' : ''} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Stats</span>
          </button>

          {/* Center Plus Button (Neon Portal) */}
          <div className="relative -top-8 px-2">
            <button
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="w-16 h-16 bg-gradient-to-br from-[#bc13fe] to-[#ff00de] text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.6)] border-4 border-[#0f172a] active:scale-90 transition-transform"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          {/* AI Page */}
          <button 
            onClick={() => setActiveTab('ai')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'ai' ? 'text-[#00f2ff] translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <Sparkles size={22} className={activeTab === 'ai' ? 'neon-text-blue' : ''} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">AI Hub</span>
          </button>

          {/* Profile Hub */}
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'profile' ? 'text-[#00f2ff] translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <User size={22} className={activeTab === 'profile' ? 'neon-text-blue' : ''} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Profile</span>
          </button>

        </div>
      </div>

      {/* Modallar */}
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
