import { useState, useEffect, useRef } from 'react';
import { Home, BarChart2, Plus, PieChart, Sparkles } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Category } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import TransactionDetailModal from './components/TransactionDetailModal';

// ... (Boshqa importlar: StatsPage, WalletModal va h.k.)

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState('home');
  
  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  
  // Home Page Ref (ViewMode ni reset qilish uchun)
  const [homeKey, setHomeKey] = useState(0); 

  useEffect(() => { saveData(data); }, [data]);

  // Tranzaksiyani saqlash (To'g'rilangan mantiq)
  const handleTransactionSave = (txData: Transaction) => {
    // ... (Boya yozganimizdek: Reversal logic)
    // Qisqartirib yozaman, boyagi mantiqni shu yerga qo'ying
    // Agar kod kerak bo'lsa oldingi javobdan oling
    let newTxList = [...data.transactions];
    let newWallets = [...data.wallets];
    
    // Tahrir bo'lsa eskisini bekor qilish...
    if(editingTx) {
       const old = data.transactions.find(t => t.id === editingTx.id);
       if(old) {
          newWallets = newWallets.map(w => {
              if(w.id === old.walletId) {
                  return { ...w, balance: w.balance + (old.type === 'income' ? -old.amount : old.amount) };
              }
              return w;
          });
          newTxList = newTxList.filter(t => t.id !== editingTx.id);
       }
    }

    // Yangisini qo'shish
    const finalTx = { ...txData, id: txData.id || Date.now().toString() };
    newTxList.push(finalTx);
    newWallets = newWallets.map(w => {
        if(w.id === finalTx.walletId) {
            return { ...w, balance: w.balance + (finalTx.type === 'income' ? finalTx.amount : -finalTx.amount) };
        }
        return w;
    });

    setData({ ...data, transactions: newTxList, wallets: newWallets });
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  const handleDelete = (id: string) => {
      // O'chirish mantig'i (Balansni tiklash bilan)
      const tx = data.transactions.find(t => t.id === id);
      if(tx) {
         const updatedWallets = data.wallets.map(w => {
             if(w.id === tx.walletId) {
                 return { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) };
             }
             return w;
         });
         setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: updatedWallets });
      }
      setContextMenu(null);
      setDetailTx(null); // Detalni ham yopish
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0f14] font-['Plus_Jakarta_Sans'] select-none">
      
      <div className="flex-1 overflow-hidden relative" onClick={() => setContextMenu(null)}>
        {activeTab === 'home' && (
            <HomePage 
                key={homeKey} // Key o'zgarsa komponent yangilanadi (Reset chart)
                data={data} 
                onNavigate={setActiveTab}
                onTransactionClick={(tx) => setDetailTx(tx)} // Detalni ochish
                onAddWallet={() => {}} 
            />
        )}
        {/* Boshqa tablar... */}
      </div>

      {/* --- MENU BAR --- */}
      <div className="fixed bottom-6 left-4 right-4 z-40">
        <div className="neu-panel rounded-[24px] h-[70px] flex justify-between items-center px-2">
           <button onClick={() => { setActiveTab('home'); setHomeKey(prev => prev + 1); }} className={`flex-1 flex justify-center ${activeTab === 'home' ? 'text-[#2ef2ff]' : 'text-gray-600'}`}><Home/></button>
           <button onClick={() => setActiveTab('stats')} className={`flex-1 flex justify-center ${activeTab === 'stats' ? 'text-[#2ef2ff]' : 'text-gray-600'}`}><BarChart2/></button>
           
           <div className="relative w-16 flex justify-center">
              <button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="absolute -top-10 w-16 h-16 rounded-full neu-panel border border-[#2ef2ff]/30 text-[#2ef2ff] flex items-center justify-center shadow-[0_0_20px_rgba(46,242,255,0.3)] active:scale-95 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </button>
           </div>
           
           <button className="flex-1 flex justify-center text-gray-600"><PieChart/></button>
           <button className="flex-1 flex justify-center text-gray-600"><Sparkles/></button>
        </div>
      </div>

      {/* Context Menu (Faqat Tahrir va O'chirish) */}
      {contextMenu && (
          <div 
              className="absolute bg-[#161a22] border border-white/10 rounded-2xl p-2 w-40 shadow-2xl z-[150]"
              style={{ top: contextMenu.y - 100, left: contextMenu.x - 50 }}
          >
              <button onClick={() => { setEditingTx(contextMenu.item); setContextMenu(null); setIsTxModalOpen(true); }} className="w-full text-left px-4 py-3 text-white text-sm font-bold">Tahrirlash</button>
              <div className="h-[1px] bg-white/5 my-1"></div>
              <button onClick={() => handleDelete(contextMenu.item.id)} className="w-full text-left px-4 py-3 text-rose-500 text-sm font-bold">O'chirish</button>
          </div>
      )}

      {/* Transaction Modal (With Category Creation) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleTransactionSave}
        categories={data.categories}
        wallets={data.wallets}
        initialData={editingTx}
        onAddCategory={(newCat) => setData({...data, categories: [...data.categories, newCat]})}
        onUpdateCategories={(updatedCats) => setData({...data, categories: updatedCats})}
      />

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
        category={data.categories.find(c => c.id === detailTx?.categoryId)}
        wallet={data.wallets.find(w => w.id === detailTx?.walletId)}
        onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }}
        onDelete={handleDelete}
      />

    </div>
  );
}

export default App;
