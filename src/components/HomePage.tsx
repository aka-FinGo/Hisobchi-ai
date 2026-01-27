import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
  onContextMenu: (e: any, item: any, type: 'wallet' | 'tx') => void;
  onAddWallet: () => void;
}

// CodePen neon ranglari
const COLORS = ['#00ffff', '#bc13fe', '#ff0055', '#ccff00', '#0099ff'];

export default function HomePage({ data, onNavigate, onTransactionClick, onContextMenu, onAddWallet }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  
  // Swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [animClass, setAnimClass] = useState('');

  // 1. Balans Hisobi
  const totalUZS = data.wallets.filter(w => w.currency === 'UZS').reduce((s, w) => s + w.balance, 0);
  const totalUSD = data.wallets.filter(w => w.currency === 'USD').reduce((s, w) => s + w.balance, 0);

  // 2. Diagramma Ma'lumotlari (Ingichka chiziqlar uchun)
  const chartData = data.wallets.map(w => ({
    id: w.id,
    name: w.name,
    value: w.currency === 'USD' ? w.balance * 12800 : w.balance,
  })).filter(i => i.value > 0);

  const totalVal = chartData.reduce((a, b) => a + b.value, 0);

  // 3. Tranzaksiyalar
  const displayedTransactions = selectedWalletId 
    ? data.transactions.filter(t => t.walletId === selectedWalletId)
    : data.transactions;

  const sortedTransactions = [...displayedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  // --- Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && viewMode === 'chart') { setAnimClass('slide-in-right'); setViewMode('cards'); }
    if (diff < -50 && viewMode === 'cards') { setAnimClass('slide-in-left'); setViewMode('chart'); }
    setTimeout(() => setAnimClass(''), 300);
  };

  return (
    <div 
      className="h-full flex flex-col overflow-y-auto scrollbar-hide pt-safe px-6 pb-48" // pb-48 bu SCROLL MUAMMOSI yechimi
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      
      {/* HEADER: Neon Text */}
      <div className="flex justify-between items-start py-6">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Mavjud Balans</p>
          <h1 className="text-3xl font-bold text-white neon-text drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            {totalUZS.toLocaleString()} <span className="text-sm text-[#00ffff]">UZS</span>
          </h1>
          <h2 className="text-xl font-bold text-[#bc13fe] mt-1 neon-text">
            {totalUSD.toLocaleString()} <span className="text-sm text-gray-500">$</span>
          </h2>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full switch-base active:scale-95 transition-transform">
           <img src={data.profile?.avatar} className="rounded-full w-10 h-10 opacity-80" alt="Av"/>
        </button>
      </div>

      {/* VIEW INDICATOR */}
      <div className="flex justify-center gap-2 mb-8">
         <div className={`h-1.5 rounded-full transition-all ${viewMode === 'chart' ? 'w-8 bg-[#00ffff] shadow-[0_0_8px_#00ffff]' : 'w-2 bg-gray-700'}`}></div>
         <div className={`h-1.5 rounded-full transition-all ${viewMode === 'cards' ? 'w-8 bg-[#00ffff] shadow-[0_0_8px_#00ffff]' : 'w-2 bg-gray-700'}`}></div>
      </div>

      <div className={animClass}>
          
          {/* --- DIAGRAMMA (CODEPEN STYLE) --- */}
          {viewMode === 'chart' && (
            <div className="flex justify-center mb-12 relative">
               
               {/* 3D SWITCH BASE (Orqa fon) */}
               <div className="switch-base w-[280px] h-[280px]">
                  
                  {/* ICHKI DARK TRACK */}
                  <div className="switch-track w-[240px] h-[240px] flex items-center justify-center relative">
                      
                      {/* INGICHKA NEON CHIZIQ */}
                      <div className="absolute inset-0 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              innerRadius={96} // Juda ingichka (4px)
                              outerRadius={100}
                              paddingAngle={5} // Bo'laklar orasi ochiq
                              dataKey="value"
                              stroke="none"
                              cornerRadius={5} // Uchlari yumaloq
                              onClick={(entry) => {
                                  setSelectedWalletId(entry.id);
                                  setAnimClass('slide-in-right');
                                  setViewMode('cards');
                              }}
                            >
                              {chartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                  className="cursor-pointer hover:opacity-100 transition-opacity"
                                  style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]})` }} // NEON GLOW
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* O'RTADAGI STATISTIKA TUGMASI */}
                      <button 
                        onClick={() => onNavigate('stats')}
                        className="w-32 h-32 rounded-full switch-base active:scale-95 transition-transform z-10 flex flex-col items-center justify-center group"
                      >
                        <Layers size={28} className="text-[#00ffff] mb-2 group-hover:scale-110 transition-transform drop-shadow-[0_0_5px_#00ffff]"/>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-white">Statistika</p>
                      </button>

                  </div>
               </div>
            </div>
          )}

          {/* --- KARTALAR --- */}
          {viewMode === 'cards' && (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[#00ffff] font-bold uppercase text-xs tracking-widest">Hamyonlar</h3>
                    {selectedWalletId && <button onClick={() => setSelectedWalletId(null)} className="text-[10px] text-gray-400">Barchasi</button>}
                </div>
                
                <div className="flex overflow-x-auto gap-4 pb-6 -mx-6 px-6 scrollbar-hide snap-x">
                    <button onClick={onAddWallet} className="snap-center shrink-0 w-[60px] h-[160px] switch-track rounded-2xl flex items-center justify-center text-[#00ffff] active:scale-95 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                        <Plus size={24} />
                    </button>

                    {data.wallets.map(w => (
                        <div 
                            key={w.id} 
                            onClick={() => setSelectedWalletId(selectedWalletId === w.id ? null : w.id)}
                            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, w, 'wallet'); }} 
                            className={`snap-center shrink-0 w-[240px] h-[160px] rounded-[24px] p-6 relative overflow-hidden transition-all ${selectedWalletId === w.id ? 'switch-track border border-[#00ffff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'switch-base'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-gray-400 text-[10px] font-bold uppercase">{w.name}</span>
                                <Wallet size={18} className="text-[#00ffff]"/>
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-wider mb-1">{w.balance.toLocaleString()}</h3>
                            <p className="text-gray-600 text-xs font-bold">{w.currency}</p>
                            
                            {/* Neon Line bezak */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ffff] to-transparent opacity-20"></div>
                        </div>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* --- TRANZAKSIYALAR --- */}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">
         {selectedWalletId ? "Karta Tarixi" : "So'nggi harakatlar"}
      </h3>
      
      {/* Scroll muammosi shu yerda pb-48 bilan yechilgan (tepada containerda) */}
      <div className="space-y-3">
         {sortedTransactions.map(t => {
           const cat = getCategory(t.categoryId);
           return (
             <div 
                key={t.id} 
                onClick={() => onTransactionClick(t)} 
                onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, t, 'tx'); }} 
                className="switch-base rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer border border-white/5 hover:border-[#00ffff]/20"
             >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full switch-track flex items-center justify-center text-[#00ffff] text-sm font-bold shadow-inner">
                      {cat?.name.slice(0,1)}
                   </div>
                   <div>
                      <h4 className="text-gray-200 font-bold text-sm">{cat?.name}</h4>
                      <p className="text-gray-600 text-[9px] font-bold uppercase mt-0.5">
                        {data.wallets.find(w => w.id === t.walletId)?.name}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#00ffff] drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                   </div>
                   {t.exchangeRate && <span className="text-[9px] text-gray-600 block">Rate: {t.exchangeRate}</span>}
                </div>
             </div>
           )
         })}
      </div>
    </div>
  );
}
