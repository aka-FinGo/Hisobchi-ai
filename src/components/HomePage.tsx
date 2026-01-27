import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, CreditCard, Layers, Plus, TrendingUp, TrendingDown } from 'lucide-react';
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
  onContextMenu: (e: any, item: any, type: 'wallet' | 'tx') => void; // Context Menu
  onAddWallet: () => void;
}

const COLORS = ['#2ef2ff', '#00e5ff', '#18ffff', '#84ffff', '#b2ebf2'];

export default function HomePage({ data, onNavigate, onTransactionClick, onContextMenu, onAddWallet }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  
  // SWIPE States
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [animClass, setAnimClass] = useState('');

  // 1. HEADER HISOBI (Alohida Dollar va So'm)
  const totalUZS = data.wallets.filter(w => w.currency === 'UZS').reduce((s, w) => s + w.balance, 0);
  const totalUSD = data.wallets.filter(w => w.currency === 'USD').reduce((s, w) => s + w.balance, 0);

  // 2. DIAGRAMMA (Dollar to UZS konvertatsiya)
  // Bu yerda biz hamyon balansini olamiz. Aniqroq bo'lishi uchun o'rtacha kursni olsak bo'ladi (masalan 12800)
  const chartData = data.wallets.map(w => ({
    id: w.id, // ID muhim
    name: w.name,
    value: w.currency === 'USD' ? w.balance * 12800 : w.balance, // Kurs bilan
    rawBalance: w.balance,
    currency: w.currency
  })).filter(i => i.value > 0);

  const totalWealthUZS = chartData.reduce((s, i) => s + i.value, 0);

  // 3. TRANZAKSIYALAR
  const displayedTransactions = selectedWalletId 
    ? data.transactions.filter(t => t.walletId === selectedWalletId)
    : data.transactions;

  const sortedTransactions = [...displayedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  // --- HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 70 && viewMode === 'chart') { 
        setAnimClass('slide-in-right'); setViewMode('cards'); 
    }
    if (diff < -70 && viewMode === 'cards') { 
        setAnimClass('slide-in-left'); setViewMode('chart'); 
    }
    // Animatsiyani tozalash
    setTimeout(() => setAnimClass(''), 300);
  };

  return (
    <div 
      className="h-full flex flex-col overflow-y-auto scrollbar-hide pt-safe px-6 pb-40" // pb-40 scroll fix
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
      
      {/* HEADER: UZS va USD alohida */}
      <div className="flex justify-between items-start py-6">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Jami Mablag'</p>
          <h1 className="text-2xl font-bold text-white text-neon tracking-wider">
            {totalUZS.toLocaleString()} <span className="text-sm text-gray-500">UZS</span>
          </h1>
          <h2 className="text-xl font-bold text-[#2ef2ff] mt-1">
            {totalUSD.toLocaleString()} <span className="text-sm text-gray-500">$</span>
          </h2>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full neu-panel flex items-center justify-center active:scale-95">
           <img src={data.profile?.avatar} className="rounded-full w-10 h-10 opacity-80" alt="Av"/>
        </button>
      </div>

      {/* VIEW SWITCHER */}
      <div className="flex justify-center gap-2 mb-6">
         <div className={`h-1 rounded-full transition-all ${viewMode === 'chart' ? 'w-8 bg-[#2ef2ff]' : 'w-2 bg-gray-700'}`}></div>
         <div className={`h-1 rounded-full transition-all ${viewMode === 'cards' ? 'w-8 bg-[#2ef2ff]' : 'w-2 bg-gray-700'}`}></div>
      </div>

      {/* --- CONTENT CONTAINER (ANIMATION) --- */}
      <div className={animClass}>
          
          {/* DIAGRAMMA REJIMI */}
          {viewMode === 'chart' && (
            <div className="flex justify-center mb-10 relative">
               {/* Ingichka Neon Halqa */}
               <div className="chart-ring-thin w-[260px] h-[260px] relative p-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        onClick={(entry) => {
                            // MUHIM: Bo'lakka bosganda Hamyonga o'tish
                            setSelectedWalletId(entry.id);
                            setAnimClass('slide-in-right');
                            setViewMode('cards');
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity drop-shadow-[0_0_5px_#2ef2ff]"/>
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => val.toLocaleString()} contentStyle={{backgroundColor:'#161a22', borderRadius:'10px', border:'none'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* O'rtaga bosganda -> Statistika */}
                  <button 
                    onClick={() => onNavigate('stats')}
                    className="absolute inset-0 m-auto w-32 h-32 rounded-full neu-pressed flex flex-col items-center justify-center active:scale-95 z-10"
                  >
                    <Layers size={24} className="text-[#2ef2ff] mb-1"/>
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Statistika</p>
                  </button>
               </div>
            </div>
          )}

          {/* KARTALAR REJIMI */}
          {viewMode === 'cards' && (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[#2ef2ff] font-bold uppercase text-xs">Hamyonlar</h3>
                    {selectedWalletId && <button onClick={() => setSelectedWalletId(null)} className="text-[10px] text-gray-400">Barchasi</button>}
                </div>
                
                <div className="flex overflow-x-auto gap-4 pb-6 -mx-6 px-6 scrollbar-hide snap-x">
                    {/* Hamyon Qo'shish Tugmasi */}
                    <button onClick={onAddWallet} className="snap-center shrink-0 w-[60px] h-[150px] neu-pressed rounded-2xl flex items-center justify-center text-[#2ef2ff] active:scale-95">
                        <Plus size={24} />
                    </button>

                    {data.wallets.map(w => (
                        <div 
                            key={w.id} 
                            onClick={() => setSelectedWalletId(selectedWalletId === w.id ? null : w.id)}
                            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, w, 'wallet'); }} // LONG PRESS
                            className={`snap-center shrink-0 w-[240px] h-[150px] rounded-[24px] p-5 relative overflow-hidden transition-all ${selectedWalletId === w.id ? 'neu-pressed border border-[#2ef2ff]/50' : 'neu-panel'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-gray-400 text-[10px] font-bold uppercase">{w.name}</span>
                                <Wallet size={16} className="text-[#2ef2ff]"/>
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-wider mb-1">{w.balance.toLocaleString()}</h3>
                            <p className="text-gray-600 text-xs font-bold">{w.currency}</p>
                        </div>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* TRANZAKSIYALAR */}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">
         {selectedWalletId ? "Karta Tarixi" : "So'nggi harakatlar"}
      </h3>
      <div className="space-y-3 pb-24">
         {sortedTransactions.map(t => {
           const cat = getCategory(t.categoryId);
           return (
             <div 
                key={t.id} 
                onClick={() => onTransactionClick(t)} // BATAFSIL
                onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, t, 'tx'); }} // LONG PRESS
                className="neu-panel rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
             >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg neu-pressed flex items-center justify-center text-[#2ef2ff] text-xs font-bold">
                      {cat?.name.slice(0,1)}
                   </div>
                   <div>
                      <h4 className="text-gray-200 font-bold text-sm">{cat?.name}</h4>
                      <p className="text-gray-600 text-[9px] font-bold uppercase mt-0.5">
                        {data.wallets.find(w => w.id === t.walletId)?.name}
                      </p>
                   </div>
                </div>
                <div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#2ef2ff]' : 'text-rose-400'}`}>
                   {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                   {/* Dollarda bo'lsa kursni ko'rsatish */}
                   {data.wallets.find(w => w.id === t.walletId)?.currency === 'USD' && <span className="text-[8px] text-gray-500 block text-right">($)</span>}
                </div>
             </div>
           )
         })}
      </div>
    </div>
  );
}
