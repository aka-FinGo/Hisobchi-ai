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

// ... (Boshqa importlar va type TabType o'z joyida qolsin)

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- ORQAGA TUGMASI LOGIKASI (FIX) ---
  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (isModalOpen) {
        setIsModalOpen(false); // Modal ochiq bo'lsa yopadi
      } else if (activeTab !== 'home') {
        setActiveTab('home'); // Boshqa tabda bo'lsa uyga qaytadi
      } else {
        CapacitorApp.exitApp(); // Uyda bo'lsa dasturdan chiqadi
      }
    });
  }, [isModalOpen, activeTab]);
  // -------------------------------------

  useEffect(() => { saveData(data); }, [data]);

  const refreshData = () => { setData(loadData()); };

  const handleSaveTransaction = (tData: any) => {
    let newTxList = [...data.transactions];
    let newWallets = [...data.wallets];

    // Agar tahrirlanayotgan bo'lsa (Edit)
    if (editingTransaction) {
      // Eski summani qaytarib olish (balansni to'g'irlash)
      const oldWallet = newWallets.find(w => w.id === editingTransaction.walletId);
      if (oldWallet) {
        oldWallet.balance -= (editingTransaction.type === 'income' ? editingTransaction.amount : -editingTransaction.amount);
      }
      // Ro'yxatdan o'chirish
      newTxList = newTxList.filter(t => t.id !== editingTransaction.id);
    }

    // Yangi tranzaksiya
    const newTx: Transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now().toString(),
      ...tData
    };

    // Yangi balansni hisoblash
    const wallet = newWallets.find(w => w.id === tData.walletId);
    if (wallet) {
      wallet.balance += (tData.type === 'income' ? tData.amount : -tData.amount);
    }

    setData({ ...data, wallets: newWallets, transactions: [newTx, ...newTxList] });
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleEditClick = (id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    if (tx) {
      setEditingTransaction(tx);
      setIsModalOpen(true);
    }
  };

  // ... (Return qismida <TransactionModal> ga editingTransaction ni props qilib berish kerak)
  
  return (
    <div className="h-full bg-gray-900 text-white font-sans selection:bg-blue-500/30">
       <div className="h-full overflow-y-auto pb-20 scrollbar-hide">
        {activeTab === 'home' && <HomePage wallets={data.wallets} transactions={data.transactions} categories={data.categories} />}
        {activeTab === 'history' && <HistoryPage transactions={data.transactions} categories={data.categories} wallets={data.wallets} onDelete={() => {}} onEdit={handleEditClick} />} 
        {/* Boshqa sahifalar... */}
        {activeTab === 'ai' && <AIPage data={data} onTransactionAdd={handleSaveTransaction} />}
        {activeTab === 'settings' && <SettingsPage data={data} onDataChange={refreshData} />}
      </div>

      {/* Navigatsiya qismi o'zgarishsiz qoladi... */}
      
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTransaction} // Tahrirlash uchun ma'lumot
      />
    </div>
  );
}

export default App;
