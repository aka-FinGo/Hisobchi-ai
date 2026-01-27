import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, BarChart2, Plus, PieChart as BudgetIcon, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction } from './types';

// Sahifalar
import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage'; 
import ProfilePage from './components/SettingsPage';
import TransactionModal from './components/TransactionModal';

// Navigatsiya turlari yangilandi
type TabType = 'home' | 'stats' | 'budget' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Eski ma'lumotni tozalash
  useEffect(() => {
     if(!data.profile) {
        try { localStorage.clear(); window.location.reload(); } catch(e){}
     }
  }, []);

  useEffect(() => { saveData(data); }, [data]);

  const handleTransactionSave = (txData: any) => {
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
    <div className="flex flex-col h-full bg-transparent font-['Plus_Jakarta_Sans']">
      
      {/* Sahifalar Konteyneri */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                data={data} 
                onNavigate={(page) => setActiveTab(page)} 
            />
        )}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'budget' && <div className="p-10 text-center text-gray-500">Budjet sahifasi (Tez orada)</div>}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
        {activeTab === 'profile' && <ProfilePage data={data} onAction={() => {}} />}
      </div>

      {/* --- FIXED MENU BAR (Pastga mixlangan) --- */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="block-3d rounded-[24px] h-[70px] flex justify-between items-center relative px-2 neon-border-thin">
          
          {/* Home */}
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'home' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}>
            <Home size={22} className={activeTab === 'home' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,1)]' : ''} />
          </button>

          {/* Stats */}
          <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'stats' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}>
            <BarChart2 size={22} className={activeTab === 'stats' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,1)]' : ''} />
          </button>

          {/* Center Plus (Yumaloq va Suzib turadigan) */}
          <div className="relative w-16 flex justify-center">
            <button
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="absolute -top-10 w-16 h-16 rounded-full bg-gradient-to-b from-orange-500 to-orange-700 text-white flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.5)] border-[4px] border-zinc-900 active:scale-90 transition-transform z-50"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          {/* Budget */}
          <button onClick={() => setActiveTab('budget')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'budget' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}>
            <BudgetIcon size={22} className={activeTab === 'budget' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,1)]' : ''} />
          </button>

          {/* AI Rejim (Profil o'rniga) */}
          <button onClick={() => setActiveTab('ai')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'ai' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}>
            <Sparkles size={22} className={activeTab === 'ai' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,1)]' : ''} />
            <span className="text-[9px] font-bold mt-0.5">AI</span>
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
