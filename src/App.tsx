import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, PieChart as BudgetIcon, User } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction } from './types';

// Komponentlar
import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage'; // Budjet o'rniga vaqtincha yoki yangi BudgetPage
import ProfilePage from './components/SettingsPage';
import TransactionModal from './components/TransactionModal';

type TabType = 'home' | 'stats' | 'budget' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Ma'lumotlarni tozalash (Xatolikni oldini olish uchun bir marta)
  useEffect(() => {
     if(!data.profile) {
        try { localStorage.clear(); window.location.reload(); } catch(e){}
     }
  }, []);

  useEffect(() => { saveData(data); }, [data]);

  const handleTransactionSave = (txData: any) => {
    // ... (Eski logikangiz bilan bir xil, qisqartirdim)
    const newTx = { ...txData, id: Date.now().toString() };
    const updatedTransactions = [...data.transactions, newTx];
    const updatedWallets = data.wallets.map(w => {
        if(w.id === txData.walletId) {
            const diff = txData.type === 'income' ? txData.amount : -txData.amount;
            return { ...w, balance: w.balance + diff };
        }
        return w;
    });
    setData({ ...data, transactions: updatedTransactions, wallets: updatedWallets });
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <HomePage data={data} />}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {/* Hozircha Budget bosilganda AI sahifasi yoki bo'sh sahifa ochiladi */}
        {activeTab === 'budget' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
        {activeTab === 'profile' && <ProfilePage data={data} onAction={() => {}} />}
      </div>

      {/* --- 3D INDUSTRIAL BOTTOM BAR --- */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="block-3d rounded-[24px] px-2 py-3 flex justify-between items-center relative shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-orange-500 -translate-y-1' : 'text-gray-500'}`}>
            <Home size={22} className={activeTab === 'home' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''} />
          </button>

          <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'stats' ? 'text-orange-500 -translate-y-1' : 'text-gray-500'}`}>
            <BarChart2 size={22} className={activeTab === 'stats' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''} />
          </button>

          {/* Center Plus (Orange Neon) */}
          <div className="relative -top-8">
            <button
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.6)] border-4 border-zinc-900 active:scale-90 transition-transform"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <button onClick={() => setActiveTab('budget')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'budget' ? 'text-orange-500 -translate-y-1' : 'text-gray-500'}`}>
            <BudgetIcon size={22} className={activeTab === 'budget' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''} />
          </button>

          <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'profile' ? 'text-orange-500 -translate-y-1' : 'text-gray-500'}`}>
            <User size={22} className={activeTab === 'profile' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''} />
          </button>

        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleTransactionSave}
        categories={data.categories}
        wallets={data.wallets}
      />
      
    </div>
  );
}

export default App;
