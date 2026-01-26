import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, Sparkles, User } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction } from './types';

// Komponentlarni import qilish
import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';
import ProfilePage from './components/SettingsPage';
import TransactionModal from './components/TransactionModal';

type TabType = 'home' | 'stats' | 'ai' | 'profile';

// --- MUHIM QISM: ESKI MA'LUMOTLARNI TOZALASH ---
// Agar oq ekran bo'layotgan bo'lsa, shu qator eski, buzilgan ma'lumotlarni o'chiradi
// va dastur yangi neon dizayn bilan noldan boshlanadi.
try {
  const testData = loadData();
  if (!testData.profile || !testData.profile.theme) {
    console.log("Eski ma'lumotlar aniqlandi. Tozalanmoqda...");
    localStorage.clear();
  }
} catch (e) {
  localStorage.clear();
}
// -------------------------------------------

function App() {
  // Endi yangi, toza ma'lumotlar yuklanadi
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Android Back Button
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

  // Auto-save
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

  const handleProfileAction = (actionType: string) => {
    console.log("Profil harakati:", actionType);
    // Keyinchalik bu yerga modal ochish kodlarini qo'shamiz
  };

  // Agar ma'lumot yuklanmasa, oq ekran o'rniga xabar chiqaramiz
  if (!data.profile) {
    return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-blue-400">Tizim qayta ishga tushmoqda...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-transparent font-['Plus_Jakarta_Sans']">
      
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
          
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'home' ? 'neon-text-blue translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <Home size={22} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Asosiy</span>
          </button>

          <button 
            onClick={() => setActiveTab('stats')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'stats' ? 'neon-text-purple translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <BarChart2 size={22} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Stat</span>
          </button>

          <div className="relative -top-8 px-2">
            <button
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="w-16 h-16 neon-btn-primary rounded-2xl flex items-center justify-center border-4 border-[#0f172a]"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('ai')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'ai' ? 'neon-text-blue translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <Sparkles size={22} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">AI</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${activeTab === 'profile' ? 'neon-text-blue translate-y-[-5px]' : 'text-gray-500'}`}
          >
            <User size={22} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Profil</span>
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
