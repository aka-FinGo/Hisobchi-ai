import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { Wallet, CreditCard, Layers, Plus } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';

interface HomePageProps {
  data: {
    wallets: WalletType[];
    transactions: Transaction[];
    categories: Category[];
    profile: any;
  };
  onNavigate: (page: string) => void;
  onTransactionClick: (tx: Transaction) => void;
  onAddWallet: () => void;
}

const COLORS = ['#2ef2ff', '#00bcd4', '#0097a7', '#006064', '#18ffff']; // Cyan shades from 12.html

export default function HomePage({ data, onNavigate, onTransactionClick, onAddWallet }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  
  // Swipe uchun
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Valyuta hisobi (Barchasini UZS ga o'girib diagramma chizamiz)
  const RATE = 12600; 
  
  const chartData = data.wallets.map(w => ({
    id: w.id,
    name: w.name,
    // Agar dollar bo'lsa kursga ko'paytiramiz, aks holda o'zi
    value: w.currency === 'USD' ? w.balance * RATE : w.balance,
    displayBalance: w.balance,
    currency: w.currency
  })).filter(i => i.value > 0);

  const totalWealth = chartData.reduce((acc, item) => acc + item.value, 0);

  // Diagramma ma'lumotlariga foiz qo'shamiz
  const chartDataWithPercent = chartData.map(item => ({
    ...item,
    percent: totalWealth > 0 ? Math.round((item.value / totalWealth) * 100) : 0
  }));

  // Tranzaksiyalarni filtrlash
  const displayedTransactions = selectedWalletId 
    ? data.transactions.filter(t => t.walletId === selectedWalletId)
    : data.transactions;

  const sortedTransactions = [...displayedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  // --- SWIPE LOGIKASI ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 70) {
      setViewMode('cards'); // Chapga surganda -> Kartalar
    }
    if (touchStartX.current - touchEndX.current < -70) {
      setViewMode('chart'); // O'ngga surganda -> Diagramma
    }
  };

  return (
    <div 
      className="h-full flex flex-col overflow-y-auto scrollbar-hide pt-safe px-6 pb-40"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Header */}
      <div className="flex justify-between items-center py-6">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Jami Mablag'</p>
          <h1 className="text-3xl font-bold text-white mt-1 text-neon drop-shadow-[0_0_10px_rgba(46,242,255,0.5)]">
            {(totalWealth).toLocaleString()} <span className="text-sm text-[#2ef2ff]">UZS eqv</span>
          </h1>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full neu-panel flex items-center justify-center active:scale-95 transition-transform">
           <img src={data.profile?.avatar} className="rounded-full w-10 h-10 opacity-80" alt="Avatar"/>
        </button>
      </div>

      {/* Switcher (Indicator) */}
      <div className="flex justify-center gap-2 mb-6">
         <div className={`w-2 h-2 rounded-full transition-all ${viewMode === 'chart' ? 'bg-[#2ef2ff] w-6' : 'bg-gray-700'}`}></div>
         <div className={`w-2 h-2 rounded-full transition-all ${viewMode === 'cards' ? 'bg-[#2ef2ff] w-6' : 'bg-gray-700'}`}></div>
      </div>

      {/* --- DIAGRAMMA VIEW --- */}
      {viewMode === 'chart' && (
        <div className="flex justify-center mb-10 relative">
           {/* 3D Knob Style Circle */}
           <div className="chart-3d-circle w-[280px] h-[280px] relative p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataWithPercent}
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    onClick={(entry) => {
                        // Bo'lakka bosilganda -> Hamyonga olib borish
                        setSelectedWalletId(entry.id);
                        setViewMode('cards'); 
                    }}
                  >
                    {chartDataWithPercent.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="cursor-pointer hover:opacity-80 transition-opacity filter drop-shadow-[0_0_3px_#2ef2ff]" 
                      />
                    ))}
                    {/* Foizlarni ko'rsatish */}
                    <LabelList 
                      dataKey="percent" 
                      position="outside" 
                      offset={15}
                      formatter={(val: number) => val > 0 ? `${val}%` : ''}
                      style={{ fill: '#cfd8dc', fontSize: '12px', fontWeight: 'bold' }} 
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* O'rtaga bosilganda -> Statistika */}
              <button 
                onClick={() => onNavigate('stats')}
                className="absolute inset-0 m-auto w-32 h-32 rounded-full neu-pressed flex flex-col items-center justify-center active:scale-95 transition-transform z-10"
              >
                <p className="text-gray-500 text-[9px] uppercase font-bold tracking-widest">Statistika</p>
                <Layers size={24} className="text-[#2ef2ff] mt-1 mb-1"/>
                <p className="text-[10px] text-[#2ef2ff]">To'liq ko'rish</p>
              </button>
           </div>
        </div>
      )}

      {/* --- KARTALAR VIEW --- */}
      {viewMode === 'cards' && (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[#2ef2ff] font-bold uppercase text-sm">Mening Hamyonlarim</h3>
                {selectedWalletId && (
                    <button onClick={() => setSelectedWalletId(null)} className="text-xs text-gray-400">Barchasi</button>
                )}
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-6 -mx-6 px-6 scrollbar-hide snap-x">
                <button onClick={onAddWallet} className="snap-center shrink-0 w-[60px] h-[160px] neu-pressed rounded-2xl flex items-center justify-center text-[#2ef2ff] active:scale-95">
                    <Plus size={24} />
                </button>
                {data.wallets.map(w => (
                    <button 
                        key={w.id} 
                        onClick={() => setSelectedWalletId(selectedWalletId === w.id ? null : w.id)}
                        className={`snap-center shrink-0 w-[260px] h-[160px] rounded-[28px] p-6 relative overflow-hidden transition-all text-left ${selectedWalletId === w.id ? 'neu-pressed border-neon-thin' : 'neu-panel'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-gray-400 text-[10px] font-bold uppercase">{w.name}</span>
                            <Wallet size={18} className="text-[#2ef2ff]"/>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-wider mb-1 text-neon">{w.displayBalance.toLocaleString()}</h3>
                        <p className="text-gray-500 text-xs font-bold">{w.currency}</p>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* --- TRANZAKSIYALAR --- */}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1 mt-auto">
         {selectedWalletId ? (data.wallets.find(w => w.id === selectedWalletId)?.name + " tarixi") : "So'nggi harakatlar"}
      </h3>
      <div className="space-y-4">
         {sortedTransactions.map(t => {
           const cat = getCategory(t.categoryId);
           return (
             <div 
                key={t.id} 
                onClick={() => onTransactionClick(t)} // BATAFSIL SAHIFAGA KIRISH
                className="neu-panel rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full neu-pressed flex items-center justify-center text-[#2ef2ff]">
                      {/* Icon */}
                      <span className="text-xs font-bold">{cat?.name.slice(0,1)}</span>
                   </div>
                   <div>
                      <h4 className="text-gray-200 font-bold text-sm">{cat?.name}</h4>
                      <p className="text-gray-600 text-[10px] font-bold uppercase mt-1">
                        {data.wallets.find(w => w.id === t.walletId)?.name}
                      </p>
                   </div>
                </div>
                <div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#2ef2ff]' : 'text-rose-400'}`}>
                   {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                </div>
             </div>
           )
         })}
      </div>
    </div>
  );
}
