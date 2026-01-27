import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Layers, CreditCard, Plus } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';

interface HomePageProps {
  data: {
    wallets: WalletType[];
    transactions: Transaction[];
    categories: Category[];
  };
  onContextMenu: (e: any, item: any, type: 'wallet' | 'tx') => void;
  onNavigate: (page: string) => void;
}

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#7c2d12', '#fb923c'];

export default function HomePage({ data, onContextMenu, onNavigate }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // Multi-valyuta hisobi
  const totalUZS = data.wallets.filter(w => w.currency === 'UZS').reduce((s, w) => s + w.balance, 0);
  const totalUSD = data.wallets.filter(w => w.currency === 'USD').reduce((s, w) => s + w.balance, 0);

  // Diagramma uchun (Faqat UZS ga o'girib ko'rsatamiz taxminan, yoki faqat so'mliklar)
  // Keling, ikkala valyutani aralashtirmaslik uchun, asosiysini ko'rsatamiz yoki alohida.
  // Hozircha UZS ekvivalenti (12600 kurs bilan)
  const chartData = data.wallets.map(w => ({
    id: w.id,
    name: w.name,
    value: w.currency === 'USD' ? w.balance * 12600 : w.balance,
    original: w.balance,
    currency: w.currency
  })).filter(i => i.value > 0);

  const displayedTransactions = selectedWalletId 
    ? data.transactions.filter(t => t.walletId === selectedWalletId)
    : data.transactions;
  
  // Sortlash
  const sortedTransactions = [...displayedTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="h-full overflow-y-auto pt-safe px-6 pb-40"> {/* pb-40 scroll fix */}
      
      {/* Total Balance */}
      <div className="py-6 flex justify-between items-start">
         <div>
            <p className="text-gray-500 text-[10px] font-bold uppercase">Umumiy Balans</p>
            <h1 className="text-3xl font-black text-white mt-1">{totalUZS.toLocaleString()} <span className="text-sm text-orange-500">UZS</span></h1>
            <h2 className="text-xl font-bold text-gray-400">{totalUSD.toLocaleString()} <span className="text-sm text-green-500">$</span></h2>
         </div>
         <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
            <img src={data.profile?.avatar} className="rounded-full w-10 h-10"/>
         </div>
      </div>

      {/* Switcher */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-white/5">
         <button onClick={() => setViewMode('chart')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${viewMode === 'chart' ? 'bg-zinc-800 text-orange-500' : 'text-gray-500'}`}>Diagramma</button>
         <button onClick={() => setViewMode('cards')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${viewMode === 'cards' ? 'bg-zinc-800 text-orange-500' : 'text-gray-500'}`}>Kartalar</button>
      </div>

      {/* CHART */}
      {viewMode === 'chart' && (
         <div className="h-[300px] flex items-center justify-center relative mb-8">
            <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full"></div>
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie 
                    data={chartData} 
                    innerRadius={80} 
                    outerRadius={110} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                    onClick={(data) => {
                        setSelectedWalletId(data.payload.id); // Diagramma bosilganda filtrlanadi
                        setViewMode('cards');
                    }}
                  >
                     {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip/>
               </PieChart>
            </ResponsiveContainer>
            {/* Center Click -> Go to Stats */}
            <button 
                onClick={() => onNavigate('stats')}
                className="absolute inset-0 flex flex-col items-center justify-center z-10"
            >
                <p className="text-gray-500 text-[9px] uppercase font-bold">Statistika</p>
                <Layers size={24} className="text-white mt-1 opacity-50"/>
            </button>
         </div>
      )}

      {/* CARDS */}
      {viewMode === 'cards' && (
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide snap-x mb-6">
              {data.wallets.map(w => (
                  <div 
                    key={w.id} 
                    onClick={() => setSelectedWalletId(selectedWalletId === w.id ? null : w.id)}
                    onContextMenu={(e) => onContextMenu(e, w, 'wallet')} // Long Press
                    className={`snap-center shrink-0 w-[260px] h-[150px] bg-zinc-800 rounded-3xl p-5 border relative overflow-hidden transition-all ${selectedWalletId === w.id ? 'border-orange-500' : 'border-white/5'}`}
                  >
                      <div className="flex justify-between items-start">
                          <span className="text-gray-500 font-bold uppercase text-[10px]">{w.name}</span>
                          <Wallet size={18} className="text-orange-500"/>
                      </div>
                      <h3 className="text-2xl font-black text-white mt-4">{w.balance.toLocaleString()}</h3>
                      <p className="text-sm font-bold text-gray-500">{w.currency}</p>
                  </div>
              ))}
          </div>
      )}

      {/* TRANSACTIONS */}
      <h3 className="font-bold text-white uppercase text-sm mb-4">
          {selectedWalletId ? "Karta Tarixi" : "So'nggi Amallar"}
      </h3>
      <div className="space-y-3 pb-20">
          {sortedTransactions.map(t => {
              const cat = data.categories.find(c => c.id === t.categoryId);
              return (
                  <div 
                    key={t.id}
                    onContextMenu={(e) => onContextMenu(e, t, 'tx')} // Long Press
                    className="bg-zinc-800 p-4 rounded-2xl flex items-center justify-between border border-white/5 active:scale-95 transition-transform"
                  >
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-xl">
                              {/* Icon logic here */}
                              🪙
                          </div>
                          <div>
                              <h4 className="font-bold text-white text-sm">{cat?.name || 'Kategoriya'}</h4>
                              <p className="text-[10px] text-gray-500 font-bold uppercase">
                                {data.wallets.find(w => w.id === t.walletId)?.name}
                              </p>
                          </div>
                      </div>
                      <div className={`font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                      </div>
                  </div>
              )
          })}
      </div>

    </div>
  );
}
