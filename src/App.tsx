import { useState, useEffect } from 'react';
import { Home, BarChart2, Plus, PieChart, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, Category } from './types';

// Komponentlar
import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage'; // Agar hali yaratmagan bo'lsangiz, bo'sh div qaytaring
import AIPage from './components/AIPage'; // Xuddi shunday

type TabType = 'home' | 'stats' | 'budget' | 'ai' | 'profile';

function App() {
  // --- STATE ---
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [homeKey, setHomeKey] = useState(0); // HomePage ni yangilash uchun kalit

  // Modallar holati
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // Tanlangan elementlar
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  // Context Menu (Long Press)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);

  // --- EFFECT ---
  // Ma'lumot o'zgarsa, saqlaymiz
  useEffect(() => {
    saveData(data);
  }, [data]);

  // --- LOGIKA: Tranzaksiyani Saqlash (MUKAMMAL) ---
  const handleTransactionSave = (txData: Transaction) => {
    let newTxList = [...data.transactions];
    let newWallets = [...data.wallets];

    // 1. Agar Tahrirlash bo'lsa: Eski tranzaksiya ta'sirini QAYTARAMIZ (Reverse Logic)
    if (editingTx) {
      const oldTx = data.transactions.find(t => t.id === editingTx.id);
      if (oldTx) {
        newWallets = newWallets.map(w => {
          if (w.id === oldTx.walletId) {
            // Agar kirim bo'lgan bo'lsa ayiramiz, chiqim bo'lsa qo'shamiz
            const reversal = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            return { ...w, balance: w.balance + reversal };
          }
          return w;
        });
        // Ro'yxatdan eskisini olib tashlaymiz
        newTxList = newTxList.filter(t => t.id !== editingTx.id);
      }
    }

    // 2. Yangi Tranzaksiyani QO'LLAYMIZ (Apply Logic)
    const finalTx = { ...txData, id: txData.id || Date.now().toString() };
    newTxList.push(finalTx);

    newWallets = newWallets.map(w => {
      if (w.id === finalTx.walletId) {
        // Kirim bo'lsa qo'shamiz, chiqim bo'lsa ayiramiz
        const effect = finalTx.type === 'income' ? finalTx.amount : -finalTx.amount;
        return { ...w, balance: w.balance + effect };
      }
      return w;
    });

    // 3. Yangilangan ma'lumotni saqlash
    setData({ ...data, transactions: newTxList, wallets: newWallets });
    
    // 4. Oynalarni yopish
    setIsTxModalOpen(false);
    setEditingTx(null);
    setDetailTx(null);
  };

  // --- LOGIKA: O'chirish ---
  const handleDelete = (id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    if (!tx) return;

    // Balansni joyiga qaytarish
    const newWallets = data.wallets.map(w => {
      if (w.id === tx.walletId) {
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

    setContextMenu(null);
    setDetailTx(null);
  };

  // --- LOGIKA: Yangi Hamyon ---
  const handleWalletSave = (newWallet: Wallet) => {
    setData({ ...data, wallets: [...data.wallets, newWallet] });
    setIsWalletModalOpen(false);
  };

  // --- NAVIGATSIYA ---
  const handleHomeClick = () => {
    setActiveTab('home');
    setHomeKey(prev => prev + 1); // Diagrammani "Chart" rejimiga qaytarish uchun
  };

  return (
    // Ekranni bosganda context menu yopilishi uchun onClick qo'shildi
    <div className="flex flex-col h-full bg-[#0c0f14] font-['Plus_Jakarta_Sans'] select-none text-[#cfd8dc]" onClick={() => setContextMenu(null)}>
      
      {/* --- ASOSIY SAHIFA KONTEYNERI --- */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <HomePage 
                key={homeKey} // Key o'zgarsa komponent yangilanadi
                data={data} 
                onNavigate={(page) => setActiveTab(page as TabType)}
                onTransactionClick={(tx) => setDetailTx(tx)} // Batafsil oynani ochish
                onContextMenu={(e, item, type) => {
                    // Long press bo'lganda menyu koordinatalarini saqlash
                    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
                }}
                onAddWallet={() => setIsWalletModalOpen(true)}
            />
        )}
        {activeTab === 'stats' && <StatsPage data={data} />}
        {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />} 
        {/* Budget va Profile sahifalarini ham shu yerga qo'shishingiz mumkin */}
      </div>

      {/* --- FIXED BOTTOM MENU BAR (MUSIC GUI STYLE) --- */}
      <div className="fixed bottom-6 left-4 right-4 z-40">
        <div className="neu-panel rounded-[24px] h-[70px] flex justify-between items-center px-2">
           
           {/* Home Button */}
           <button onClick={handleHomeClick} className={`flex-1 flex flex-col items-center justify-center transition-colors ${activeTab === 'home' ? 'text-[#2ef2ff]' : 'text-gray-600'}`}>
             <Home size={22} className={activeTab === 'home' ? 'drop-shadow-[0_0_5px_rgba(46,242,255,0.8)]' : ''} />
           </button>

           {/* Stats Button */}
           <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center justify-center transition-colors ${activeTab === 'stats' ? 'text-[#2ef2ff]' : 'text-gray-600'}`}>
             <BarChart2 size={22} />
           </button>
           
           {/* Floating PLUS Button (Neon) */}
           <div className="relative w-16 flex justify-center">
              <button 
                onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} 
                className="absolute -top-10 w-16 h-16 rounded-full neu-panel border border-[#2ef2ff]/30 text-[#2ef2ff] flex items-center justify-center shadow-[0_0_20px_rgba(46,242,255,0.3)] active:scale-95 transition-transform z-50"
              >
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           
           {/* Budget/Pie Button */}
           <button onClick={() => setActiveTab('budget')} className={`flex-1 flex flex-col items-center justify-center transition-colors ${activeTab === 'budget' ? 'text-[#2ef2ff]' : 'text-gray-600'}`}>
             <PieChart size={22} />
           </button>

           {/* AI Button */}
           <button onClick={() => setActiveTab('ai')} className={`flex-1 flex flex-col items-center justify-center transition-colors ${activeTab === 'ai' ? 'text-[#2ef2ff]' : 'text-gray-600'}`}>
             <Sparkles size={22} />
             <span className="text-[9px] font-bold mt-0.5">AI</span>
           </button>
        </div>
      </div>

      {/* --- CONTEXT MENU (LONG PRESS) --- */}
      {contextMenu && (
          <div 
              className="absolute bg-[#161a22] border border-white/10 rounded-2xl p-1.5 w-40 shadow-2xl z-[150] animate-slideUp"
              style={{ 
                  top: contextMenu.y - 100, // Barmoqdan biroz tepada chiqishi uchun
                  left: Math.min(contextMenu.x - 20, window.innerWidth - 170) // Ekrandan chiqib ketmasligi uchun
              }}
              onClick={(e) => e.stopPropagation()} // Menyu ichini bosganda yopilmasligi uchun
          >
              <button onClick={() => { 
                  if(contextMenu.type === 'tx') { 
                      setEditingTx(contextMenu.item); 
                      setIsTxModalOpen(true); 
                  }
                  setContextMenu(null);
              }} className="w-full text-left px-3 py-3 text-white text-xs font-bold hover:bg-white/5 rounded-xl flex items-center gap-2">
                 ✏️ Tahrirlash
              </button>
              
              <div className="h-[1px] bg-white/5 my-1"></div>
              
              <button onClick={() => handleDelete(contextMenu.item.id)} className="w-full text-left px-3 py-3 text-rose-500 text-xs font-bold hover:bg-rose-500/10 rounded-xl flex items-center gap-2">
                 🗑️ O'chirish
              </button>
          </div>
      )}

      {/* --- MODALLAR --- */}
      
      {/* 1. Yangi Hamyon */}
      <WalletModal 
         isOpen={isWalletModalOpen} 
         onClose={() => setIsWalletModalOpen(false)}
         onSave={handleWalletSave}
      />
      
      {/* 2. Tranzaksiya (Qo'shish va Tahrirlash) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleTransactionSave}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTx}
        // Yangi kategoriya qo'shilganda AppData ni yangilash
        onAddCategory={(newCat) => setData({...data, categories: [...data.categories, newCat]})}
        onUpdateCategories={(updatedCats) => setData({...data, categories: updatedCats})}
      />

      {/* 3. Batafsil Ko'rish */}
      <TransactionDetailModal
        isOpen={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
        category={data.categories.find(c => c.id === detailTx?.categoryId)}
        wallet={data.wallets.find(w => w.id === detailTx?.walletId)}
        onEdit={(tx) => { 
            setDetailTx(null); // Detalni yopamiz
            setEditingTx(tx);  // Tahrirni ochamiz
            setIsTxModalOpen(true); 
        }}
        onDelete={handleDelete}
      />

    </div>
  );
}

export default App;
