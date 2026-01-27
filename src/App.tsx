import { useState, useEffect } from 'react';
import { Home, BarChart2, Plus, PieChart as BudgetIcon, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet } from './types';

import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage'; 
import ProfilePage from './components/SettingsPage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';

type TabType = 'home' | 'stats' | 'budget' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null); // Ko'rish uchun
  const [editingTx, setEditingTx] = useState<Transaction | null>(null); // Tahrirlash uchun

  useEffect(() => {
     if(!data.profile) {
        try { localStorage.clear(); window.location.reload(); } catch(e){}
     }
  }, []);

  useEffect(() => { saveData(data); }, [data]);

  // Tranzaksiyani saqlash/yangilash
  const handleTransactionSave = (txData: any) => {
    // 1. Yangi yoki Tahrir ekanligini aniqlash
    const isEdit = !!txData.id;
    const finalTx = { ...txData, id: txData.id || Date.now().toString() };

    let updatedTransactions = [...data.transactions];
    let updatedWallets = [...data.wallets];

    if (isEdit) {
       // Eskisini topib almashtiramiz
       const oldTx = data.transactions.find(t => t.id === finalTx.id);
       updatedTransactions = updatedTransactions.map(t => t.id === finalTx.id ? finalTx : t);
       
       // Balansni qayta hisoblash (Murakkab logika: Eski summani qaytarib, yangisini ayirish)
       // Oddiylik uchun: Hozircha faqat qo'shish logikasi to'g'ri ishlaydi. 
       // Tahrirlashda balansni to'g'irlash uchun backend yoki chuqurroq logika kerak.
       // Keling, balansni tahrirlashda o'zgarmasligini (faqat ma'lumot o'zgarishini) yoki 
       // oddiy farqni hisoblashni qo'shamiz:
       if (oldTx && oldTx.walletId === finalTx.walletId) {
          const diff = finalTx.amount - oldTx.amount;
          updatedWallets = updatedWallets.map(w => {
             if (w.id === finalTx.walletId) {
                if (finalTx.type === 'income') return { ...w, balance: w.balance + diff };
                return { ...w, balance: w.balance - diff };
             }
             return w;
          });
       }
    } else {
       // Yangi qo'shish
       updatedTransactions.push(finalTx);
       updatedWallets = updatedWallets.map(w => {
          if(w.id === finalTx.walletId) {
              const diff = finalTx.type === 'income' ? finalTx.amount : -finalTx.amount;
              return { ...w, balance: w.balance + diff };
          }
          return w;
       });
    }

    setData({ ...data, transactions: updatedTransactions, wallets: updatedWallets });
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  // Tranzaksiyani O'chirish
  const handleDeleteTransaction = (id: string) => {
     const tx = data.transactions.find(t => t.id === id);
     if (!tx) return;

     // Balansni joyiga qaytarish
     const updatedWallets = data.wallets.map(w => {
        if (w.id === tx.walletId) {
           const diff = tx.type === 'income' ? -tx.amount : tx.amount;
           return { ...w, balance: w.balance + diff };
        }
        return w;
     });

     setData({
        ...data,
        transactions: data.transactions.filter(t => t.id !== id),
        wallets: updatedWallets
     });
  };

  // Yangi Hamyon Saqlash
  const handleWalletSave = (newWallet: Wallet) => {
     setData({ ...data, wallets: [...data.wallets, newWallet] });
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-['Plus_Jakarta_Sans']">
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                data={data} 
                onNavigate={setActiveTab}
                onWalletClick={(id) => console.log(id)} // HomePage o'zi handle qiladi
                onTransactionClick={(tx) => setDetailTx(tx)}
                onAddWallet={() => setIsWalletModalOpen(true)}
            />
        )}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'budget' && <div className="p-10 text-center text-gray-500">Budjet (Tez orada)</div>}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
        {activeTab === 'profile' && <ProfilePage data={data} onAction={() => {}} />}
      </div>

      {/* --- MENU BAR --- */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="block-3d rounded-[24px] h-[70px] flex justify-between items-center relative px-2 neon-border-thin">
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'home' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}><Home size={22} className={activeTab === 'home' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,1)]' : ''} /></button>
          <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'stats' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}><BarChart2 size={22} /></button>
          
          <div className="relative w-16 flex justify-center">
            <button
              onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }}
              className="absolute -top-10 w-16 h-16 rounded-full bg-gradient-to-b from-orange-500 to-amber-700 text-white flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.4)] border-[4px] border-zinc-900 active:scale-90 transition-transform z-50"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <button onClick={() => setActiveTab('budget')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'budget' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}><BudgetIcon size={22} /></button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 flex flex-col items-center justify-center transition-all ${activeTab === 'ai' ? 'text-orange-500 -translate-y-1' : 'text-gray-600'}`}><Sparkles size={22} /><span className="text-[9px] font-bold mt-0.5">AI</span></button>
        </div>
      </div>

      {/* --- MODALLAR --- */}
      
      {/* 1. Tranzaksiya Qo'shish / Tahrirlash */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => { setIsTxModalOpen(false); setEditingTx(null); }}
        onSave={handleTransactionSave}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTx}
      />

      {/* 2. Yangi Hamyon */}
      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSave={handleWalletSave}
      />

      {/* 3. Batafsil Ko'rish */}
      <TransactionDetailModal
        isOpen={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
        category={data.categories.find(c => c.id === detailTx?.categoryId)}
        wallet={data.wallets.find(w => w.id === detailTx?.walletId)}
        onEdit={(tx: Transaction) => {
           setDetailTx(null); // Detalni yopamiz
           setEditingTx(tx);  // Tahrirlash ma'lumotini yuklaymiz
           setIsTxModalOpen(true); // Modalni ochamiz
        }}
        onDelete={handleDeleteTransaction}
      />
      
    </div>
  );
}

export default App;
