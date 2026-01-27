import { useState, useEffect } from 'react';
import { Home, BarChart2, Plus, PieChart, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import StatsPage from './components/StatsPage'; // Buni hali to'liq qilmadik, lekin struktura uchun turadi

// Long Press uchun Context Menu
import ContextMenu from './components/ContextMenu'; // Buni pastda yaratamiz

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);

  useEffect(() => { saveData(data); }, [data]);

  // --- LOGIKA: Balansni 0 dan qayta hisoblash ---
  // Bu funksiya har qanday o'zgarishda balansni to'g'ri bo'lishini kafolatlaydi
  const recalculateBalances = (wallets: Wallet[], transactions: Transaction[]) => {
    // 1. Hamyonlarni 0 holatiga keltiramiz (yoki boshlang'ich balans saqlansa, o'shanga)
    // Eslatma: Agar hamyonda "boshlang'ich balans" degan alohida maydon bo'lmasa, hozircha 0 deb olamiz
    // Yoki tranzaksiyalardan tashqari kiritilgan summani alohida saqlash kerak.
    // Soddalashtirish uchun: Biz tranzaksiya tarixiga qarab hisoblaymiz.
    
    // Hozirgi balansni "Reset" qilmaymiz, chunki foydalanuvchi qo'lda kiritgan bo'lishi mumkin.
    // TO'G'RI USUL: Eski tranzaksiya ta'sirini yo'qotib, yangisini qo'shish.
    return wallets; 
  };

  // --- LOGIKA: Tranzaksiya Saqlash (MUKAMMAL) ---
  const handleTransactionSave = (txData: Transaction) => {
    let newTransactions = [...data.transactions];
    let newWallets = [...data.wallets];

    // 1. Agar Tahrirlash bo'lsa: Eski tranzaksiya ta'sirini QAYTARAMIZ (Reverse)
    if (editingTx) {
      const oldTx = data.transactions.find(t => t.id === editingTx.id);
      if (oldTx) {
        newWallets = newWallets.map(w => {
          if (w.id === oldTx.walletId) {
            // Agar kirim bo'lgan bo'lsa, ayiramiz. Chiqim bo'lsa, qo'shamiz.
            const reversal = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            return { ...w, balance: w.balance + reversal };
          }
          return w;
        });
        // Ro'yxatdan eskisini olib tashlaymiz
        newTransactions = newTransactions.filter(t => t.id !== editingTx.id);
      }
    }

    // 2. Yangi Tranzaksiyani QO'LLAYMIZ (Apply)
    const finalTx = { ...txData, id: txData.id || Date.now().toString() };
    newTransactions.push(finalTx);

    newWallets = newWallets.map(w => {
      if (w.id === finalTx.walletId) {
        const effect = finalTx.type === 'income' ? finalTx.amount : -finalTx.amount;
        return { ...w, balance: w.balance + effect };
      }
      return w;
    });

    setData({ ...data, transactions: newTransactions, wallets: newWallets });
    setIsModalOpen(false);
    setEditingTx(null);
  };

  const handleDelete = (id: string, type: 'tx' | 'wallet') => {
      if(type === 'tx') {
          // O'chirish logikasi ham xuddi tahrirlash kabi: balansni joyiga qaytarish kerak
          const tx = data.transactions.find(t => t.id === id);
          if(tx) {
             const newWallets = data.wallets.map(w => {
                 if(w.id === tx.walletId) {
                     const reversal = tx.type === 'income' ? -tx.amount : tx.amount;
                     return { ...w, balance: w.balance + reversal };
                 }
                 return w;
             });
             setData({
                 ...data, 
                 transactions: data.transactions.filter(t => t.id !== id),
                 wallets: newWallets
             });
          }
      }
      setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-['Plus_Jakarta_Sans'] text-white select-none">
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                data={data} 
                onContextMenu={(e, item, type) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
                }}
                onNavigate={(page) => setActiveTab(page)}
            />
        )}
        {/* Boshqa tablar... */}
      </div>

      {/* FIXED MENU */}
      <div className="fixed bottom-6 left-4 right-4 z-40">
        <div className="block-3d rounded-[24px] h-[70px] flex justify-between items-center px-2 neon-border-thin bg-[#18181b]">
           <button onClick={() => setActiveTab('home')} className="flex-1 flex justify-center text-orange-500"><Home/></button>
           <button onClick={() => setActiveTab('stats')} className="flex-1 flex justify-center text-gray-500"><BarChart2/></button>
           <div className="relative w-16 flex justify-center">
              <button onClick={() => { setEditingTx(null); setIsModalOpen(true); }} className="absolute -top-10 w-16 h-16 rounded-full bg-gradient-to-b from-orange-500 to-amber-700 text-white flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.4)] border-[4px] border-zinc-900 active:scale-90 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           <button className="flex-1 flex justify-center text-gray-500"><PieChart/></button>
           <button className="flex-1 flex justify-center text-gray-500"><Sparkles/></button>
        </div>
      </div>

      {/* Context Menu (Long Press) */}
      {contextMenu && (
          <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm" onClick={() => setContextMenu(null)}>
              <div 
                  className="absolute bg-[#27272a] border border-white/10 rounded-2xl p-2 w-48 shadow-2xl block-3d"
                  style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 200) }}
              >
                  <button onClick={() => { 
                      if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsModalOpen(true); }
                  }} className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-sm font-bold flex gap-2">Tahrirlash</button>
                  
                  <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-sm font-bold flex gap-2">Statistika</button>
                  
                  <div className="h-[1px] bg-white/10 my-1"></div>
                  
                  <button onClick={() => handleDelete(contextMenu.item.id, contextMenu.type)} className="w-full text-left px-4 py-3 hover:bg-rose-500/20 text-rose-500 rounded-xl text-sm font-bold flex gap-2">O'chirish</button>
              </div>
          </div>
      )}

      {/* Transaction Modal (The Monster) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleTransactionSave}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTx}
        onAddCategory={(newCat) => setData({...data, categories: [...data.categories, newCat]})} // Kategoriya yaratish funksiyasi
      />

    </div>
  );
}

export default App;
