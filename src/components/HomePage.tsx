import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Layers, CreditCard, Plus } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';

interface HomePageProps {
  data: {
    wallets: WalletType[];
    transactions: Transaction[];
    categories: Category[];
    profile: any;
  };
  onNavigate: (page: any) => void;
  onWalletClick: (walletId: string) => void;
  onTransactionClick: (tx: Transaction) => void;
  onAddWallet: () => void;
}

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#7c2d12', '#fb923c'];

export default function HomePage({ data, onNavigate, onWalletClick, onTransactionClick, onAddWallet }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // Valyuta kursi (taxminiy)
  const RATE = 12600; 

  const totalBalance = data.wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * RATE : w.balance), 0);

  const chartData = data.wallets.map(w => ({
    id: w.id, // ID qo'shildi click uchun
    name: w.name,
    value: w.currency === 'USD' ? w.balance * RATE : w.balance,
  })).filter(i => i.value > 0);

  const displayedTransactions = selectedWalletId 
    ? data.transactions.filter(t => t.walletId === selectedWalletId)
    : data.transactions;

  const sortedTransactions = [...displayedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30); // 30 ta eng oxirgi

  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  // Diagramma bo'lagi bosilganda
  const handlePieClick = (entry: any) => {
    if (entry && entry.id) {
       setSelectedWalletId(entry.id);
       setViewMode('cards'); // Kartalar ko'rinishiga o'tish
       // Agar kerak bo'lsa, avtomatik scroll qilish mumkin
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto scrollbar-hide pt-safe px-6 pb-32">
      
      {/* Header */}
      <div className="flex justify-between items-center py-6">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Umumiy hisob</p>
          <h1 className="text-3xl font-black text-white mt-1 text-glow">
            {totalBalance.toLocaleString()} <span className="text-sm text-orange-500">UZS</span>
          </h1>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full block-3d flex items-center justify-center p-1 active:scale-95 transition-transform">
           <img src={data.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=FinGo"} className="rounded-full" alt="Avatar"/>
        </button>
      </div>

      {/* Switcher */}
      <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl mb-8 border border-white/5">
        <button onClick={() => setViewMode('chart')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'chart' ? 'block-3d text-orange-500 neon-border-thin' : 'text-gray-600'}`}>
          <Layers size={16} /> Diagramma
        </button>
        <button onClick={() => setViewMode('cards')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'cards' ? 'block-3d text-orange-500 neon-border-thin' : 'text-gray-600'}`}>
          <CreditCard size={16} /> Kartalar
        </button>
      </div>

      {/* Diagramma */}
      {viewMode === 'chart' && (
        <div className="flex justify-center mb-10 relative">
           <div className="absolute inset-0 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>
           <div className="chart-ring-3d w-[280px] h-[280px] relative p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    onClick={(data) => handlePieClick(data.payload)} // Click Event
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{backgroundColor:'#27272a', borderRadius:'12px', border:'none'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">Mavjud</p>
                <p className="text-xl font-black text-white">{totalBalance.toLocaleString()}</p>
                <p className="text-orange-500 text-[10px] font-bold">UZS</p>
              </div>
           </div>
        </div>
      )}

      {/* Kartalar */}
      {viewMode === 'cards' && (
        <div className="mb-8 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide flex gap-4 snap-x">
             <button onClick={onAddWallet} className="snap-center shrink-0 w-[60px] h-[160px] block-3d rounded-2xl flex items-center justify-center text-orange-500 active:scale-95">
                <Plus size={24} />
             </button>
             {data.wallets.map((wallet) => (
               <button 
                  key={wallet.id}
                  onClick={() => setSelectedWalletId(wallet.id === selectedWalletId ? null : wallet.id)}
                  className={`snap-center shrink-0 w-[260px] h-[160px] rounded-[28px] p-6 relative overflow-hidden transition-all text-left ${selectedWalletId === wallet.id ? 'border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'block-3d'}`}
               >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                  <div className="flex justify-between mb-4">
                     <span className="text-gray-500 text-[10px] font-bold uppercase">{wallet.name}</span>
                     <Wallet size={18} className="text-orange-500"/>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-1">{wallet.balance.toLocaleString()}</h3>
                  <p className="text-gray-600 text-xs font-bold">{wallet.currency}</p>
               </button>
             ))}
        </div>
      )}

      {/* Tranzaksiyalar */}
      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 pl-1">
         {selectedWalletId ? (data.wallets.find(w => w.id === selectedWalletId)?.name + " tarixi") : "So'nggi harakatlar"}
      </h3>
      <div className="space-y-3">
         {sortedTransactions.map(t => {
           const cat = getCategory(t.categoryId);
           return (
             <button 
                key={t.id} 
                onClick={() => onTransactionClick(t)} // Detail Modal ochish
                className="w-full block-3d rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 text-orange-500 shadow-inner">
                      <span className="font-bold text-[10px]">{cat?.name.slice(0,2).toUpperCase()}</span>
                   </div>
                   <div className="text-left">
                      <h4 className="text-white font-bold text-sm">{cat?.name}</h4>
                      <p className="text-gray-600 text-[10px] font-bold uppercase mt-0.5">{t.note || t.date}</p>
                   </div>
                </div>
                <div className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                </div>
             </button>
           )
         })}
      </div>
    </div>
  );
}
