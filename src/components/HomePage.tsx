import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Layers, CreditCard, ChevronRight, Plus } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';

interface HomePageProps {
  data: {
    wallets: WalletType[];
    transactions: Transaction[];
    categories: Category[];
  };
}

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#7c2d12', '#fb923c']; // Orange shades

export default function HomePage({ data }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // 1. Hisob-kitoblar
  const totalBalance = data.wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12600 : w.balance), 0);

  const chartData = data.wallets.map(w => ({
    name: w.name,
    value: w.currency === 'USD' ? w.balance * 12600 : w.balance,
    originalBalance: w.balance,
    currency: w.currency
  })).filter(i => i.value > 0);

  // Tanlangan hamyon yoki barcha tranzaksiyalar
  const displayedTransactions = selectedWalletId 
    ? data.transactions.filter(t => t.walletId === selectedWalletId)
    : data.transactions;

  const sortedTransactions = [...displayedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  return (
    <div className="h-full flex flex-col pb-24 overflow-y-auto scrollbar-hide pt-safe px-6">
      
      {/* Header */}
      <div className="flex justify-between items-center py-6">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Umumiy hisob</p>
          <h1 className="text-3xl font-black text-white mt-1 orange-gradient-text">
            {totalBalance.toLocaleString()} <span className="text-lg text-orange-500">UZS</span>
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full block-3d flex items-center justify-center p-1">
           <img src={data.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="rounded-full" alt="Avatar"/>
        </div>
      </div>

      {/* Switcher (Diagramma / Kartalar) */}
      <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl mb-6 border border-white/5">
        <button 
          onClick={() => { setViewMode('chart'); setSelectedWalletId(null); }}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'chart' ? 'block-3d text-orange-500 shadow-orange-500/20' : 'text-gray-500'}`}
        >
          <Layers size={16} /> Diagramma
        </button>
        <button 
          onClick={() => setViewMode('cards')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'cards' ? 'block-3d text-orange-500 shadow-orange-500/20' : 'text-gray-500'}`}
        >
          <CreditCard size={16} /> Kartalar
        </button>
      </div>

      {/* --- DIAGRAMMA REJIMI --- */}
      {viewMode === 'chart' && (
        <div className="relative block-3d rounded-[40px] p-6 mb-8 neon-orange-border flex flex-col items-center justify-center h-[320px]">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full pointer-events-none"></div>
          
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => value.toLocaleString() + ' UZS'}
                contentStyle={{ backgroundColor: '#27272a', borderRadius: '12px', border: '1px solid #3f3f46', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* O'rtadagi Yozuv */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Jami</p>
            <p className="text-2xl font-black text-white text-glow-orange">{totalBalance.toLocaleString()}</p>
            <p className="text-orange-500 text-xs font-bold">UZS</p>
          </div>

          {/* Legend (Tushuntirish) */}
          <div className="absolute bottom-4 w-full px-4 flex justify-center gap-4 flex-wrap">
             {chartData.map((w, i) => {
               const percent = ((w.value / totalBalance) * 100).toFixed(0);
               return (
                 <div key={i} className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                   <span className="text-[10px] text-gray-300 font-bold">{w.name} {percent}%</span>
                 </div>
               )
             })}
          </div>
        </div>
      )}

      {/* --- KARTALAR REJIMI --- */}
      {viewMode === 'cards' && (
        <div className="mb-8 space-y-4">
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide snap-x">
             {/* Add Card Button */}
             <div className="snap-center shrink-0 w-[60px] flex items-center justify-center">
                <button className="w-14 h-14 block-3d rounded-2xl flex items-center justify-center text-orange-500 active:scale-95 transition-transform">
                  <Plus size={24} />
                </button>
             </div>

             {data.wallets.map((wallet) => {
               // Kartaga kirim/chiqim foizini hisoblash
               const wTxs = data.transactions.filter(t => t.walletId === wallet.id);
               const wInc = wTxs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
               const wExp = wTxs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
               const flow = wInc + wExp || 1; 
               const incPercent = Math.round((wInc / flow) * 100);

               return (
                 <button 
                    key={wallet.id}
                    onClick={() => setSelectedWalletId(wallet.id === selectedWalletId ? null : wallet.id)}
                    className={`snap-center shrink-0 w-[280px] h-[180px] rounded-[32px] p-6 relative overflow-hidden transition-all text-left ${selectedWalletId === wallet.id ? 'border-2 border-orange-500 neon-orange-border' : 'block-3d'}`}
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                       <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{wallet.name}</span>
                       <div className="text-orange-500">{wallet.type === 'card' ? <CreditCard size={20}/> : <Wallet size={20}/>}</div>
                    </div>

                    <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">
                      {wallet.balance.toLocaleString()} 
                      <span className="text-sm text-gray-500 ml-1 font-normal">{wallet.currency}</span>
                    </h3>

                    <div className="flex gap-3 mt-auto">
                       <div className="flex-1 bg-black/30 rounded-lg p-2 border border-white/5">
                          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mb-1">
                             <TrendingUp size={12}/> {incPercent}%
                          </div>
                          <p className="text-[10px] text-gray-400">Kirim</p>
                       </div>
                       <div className="flex-1 bg-black/30 rounded-lg p-2 border border-white/5">
                          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold mb-1">
                             <TrendingDown size={12}/> {100 - incPercent}%
                          </div>
                          <p className="text-[10px] text-gray-400">Chiqim</p>
                       </div>
                    </div>
                 </button>
               )
             })}
          </div>
        </div>
      )}

      {/* --- TRANZAKSIYALAR (3D Blocks) --- */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
             {selectedWalletId ? "Karta tarixi" : "So'nggi harakatlar"}
          </h3>
          <button className="text-orange-500 text-xs font-bold">Barchasi</button>
        </div>

        <div className="space-y-3">
           {sortedTransactions.length === 0 ? (
             <div className="text-center py-10 text-gray-600 font-medium">Hozircha bo'shliq...</div>
           ) : (
             sortedTransactions.map(t => {
               const cat = getCategory(t.categoryId);
               return (
                 <div key={t.id} className="block-3d rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 shadow-inner text-orange-400">
                          {/* Ikonka joylashuvi */}
                          <span className="font-bold text-xs">{cat?.name.slice(0,2).toUpperCase()}</span>
                       </div>
                       <div>
                          <h4 className="text-white font-bold text-sm">{cat?.name}</h4>
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                            {data.wallets.find(w => w.id === t.walletId)?.name} • {t.note || t.date}
                          </p>
                       </div>
                    </div>
                    <div className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                    </div>
                 </div>
               )
             })
           )}
        </div>
      </div>

    </div>
  );
}
