import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, CreditCard, Layers, Plus, TrendingUp } from 'lucide-react';
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

// HUD diagram.html ranglariga asoslangan palitra
const HUD_COLORS = ['#ff3366', '#00d4ff', '#bb86fc', '#00ff9d', '#ffbf00'];

// --- CUSTOM TOOLTIP (Siz yuborgan fayldagi effekt) ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="hud-tooltip animate-slideUp">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{data.name}</p>
        <h4 className="text-xl font-bold text-white mb-1">
          {data.value.toLocaleString()} 
          <span className="text-xs text-gray-400 ml-1">{data.currency}</span>
        </h4>
        <div className="flex items-center gap-2 mt-2">
           <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-current" style={{ width: `${data.percent}%`, backgroundColor: data.fill }}></div>
           </div>
           <span className="text-xs font-bold" style={{ color: data.fill }}>{data.percent}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function HomePage({ data, onNavigate, onTransactionClick, onContextMenu, onAddWallet }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  
  // Carousel va Swipe
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [animClass, setAnimClass] = useState('');

  // 1. Data Prep
  const totalUZS = data.wallets.filter(w => w.currency === 'UZS').reduce((s, w) => s + w.balance, 0);
  const totalUSD = data.wallets.filter(w => w.currency === 'USD').reduce((s, w) => s + w.balance, 0);
  
  // Jami boylik (so'mda, foiz hisoblash uchun)
  const totalWealth = data.wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12800 : w.balance), 0);

  const chartData = data.wallets.map((w, index) => {
    const valInUZS = w.currency === 'USD' ? w.balance * 12800 : w.balance;
    return {
      id: w.id,
      name: w.name,
      value: valInUZS,
      displayBalance: w.balance,
      currency: w.currency,
      fill: HUD_COLORS[index % HUD_COLORS.length],
      percent: totalWealth > 0 ? Math.round((valInUZS / totalWealth) * 100) : 0
    };
  }).filter(i => i.value > 0);

  // Active Wallet logic
  const activeWallet = viewMode === 'cards' ? data.wallets[currentWalletIndex] : null;
  const displayedTransactions = activeWallet
    ? data.transactions.filter(t => t.walletId === activeWallet.id)
    : data.transactions;

  const sortedTransactions = [...displayedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  // --- SWIPE HANDLER ---
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    
    // Swipe Left (Next)
    if (diff > 50) { 
        if (viewMode === 'chart') { setAnimClass('slide-in-right'); setViewMode('cards'); }
        else if (viewMode === 'cards' && currentWalletIndex < data.wallets.length - 1) {
             setAnimClass('slide-in-right'); setCurrentWalletIndex(prev => prev + 1);
        }
    }
    // Swipe Right (Prev)
    if (diff < -50) { 
        if (viewMode === 'cards') {
            if (currentWalletIndex > 0) {
                setAnimClass('slide-in-left'); setCurrentWalletIndex(prev => prev - 1);
            } else {
                setAnimClass('slide-in-left'); setViewMode('chart');
            }
        }
    }
    setTimeout(() => setAnimClass(''), 300);
  };

  return (
    <div 
      className="h-full flex flex-col overflow-y-auto pt-safe px-4 pb-48" // pb-48 Scroll muammosini hal qiladi
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      
      {/* HEADER: HUD Style */}
      <div className="flex justify-between items-start py-6 px-2">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Jami Mablag'</p>
          <h1 className="text-3xl font-bold text-white tracking-wider chart-neon-glow">
            {totalUZS.toLocaleString()} <span className="text-sm text-[#00d4ff]">UZS</span>
          </h1>
          <h2 className="text-xl font-bold text-[#bb86fc] mt-1 chart-neon-glow">
            {totalUSD.toLocaleString()} <span className="text-sm text-gray-500">$</span>
          </h2>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full hud-panel flex items-center justify-center active:scale-95 border border-white/10">
           <img src={data.profile?.avatar} className="rounded-full w-10 h-10 opacity-90" alt="Av"/>
        </button>
      </div>

      {/* VIEW INDICATOR */}
      <div className="flex justify-center gap-2 mb-6">
         <div className={`h-1 rounded-full transition-all ${viewMode === 'chart' ? 'w-6 bg-[#00d4ff]' : 'w-2 bg-gray-700'}`}></div>
         {data.wallets.map((_, i) => (
             <div key={i} className={`h-1 rounded-full transition-all ${viewMode === 'cards' && currentWalletIndex === i ? 'w-6 bg-[#00d4ff]' : 'w-2 bg-gray-700'}`}></div>
         ))}
      </div>

      <div className={`flex-1 ${animClass}`}>
          
          {/* --- DIAGRAMMA (DOUBLE PIE) --- */}
          {viewMode === 'chart' && (
            <div className="flex justify-center mb-8 relative">
               <div className="w-[300px] h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {/* 1. TASHQI QAVAT: 3D Bloklar (Qalin) */}
                      <Pie
                        data={chartData}
                        innerRadius={90}  // Ichkarisi
                        outerRadius={115} // Tashqarisi (Qalinligi 25px)
                        paddingAngle={6}  // Bo'laklar orasidagi masofa
                        cornerRadius={6}  // Bloklar cheti yumaloq
                        dataKey="value"
                        stroke="none"
                        onClick={(entry) => {
                            const wIndex = data.wallets.findIndex(w => w.id === entry.id);
                            if(wIndex >= 0) {
                                setCurrentWalletIndex(wIndex);
                                setAnimClass('slide-in-right');
                                setViewMode('cards');
                            }
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-outer-${index}`} 
                            fill={entry.fill}
                            className="chart-3d-filter cursor-pointer hover:opacity-80 transition-opacity" 
                          />
                        ))}
                      </Pie>

                      {/* 2. ICHKI QAVAT: Ingichka Neon Chiziq (1-2px) */}
                      <Pie
                        data={chartData}
                        innerRadius={82} 
                        outerRadius={84} // 2px qalinlik
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-inner-${index}`} 
                            fill={entry.fill} 
                            className="chart-neon-glow" // Glow effekti
                          />
                        ))}
                      </Pie>
                      
                      {/* Qalqib chiquvchi oyna (Exampledagi stil) */}
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* O'rtadagi Statistika Tugmasi */}
                  <button onClick={() => onNavigate('stats')} className="absolute inset-0 m-auto w-32 h-32 rounded-full hud-pressed flex flex-col items-center justify-center active:scale-95 z-10 border border-[#00d4ff]/20">
                    <Layers size={28} className="text-[#00d4ff] mb-2 drop-shadow-[0_0_5px_#00d4ff]"/>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Statistika</p>
                  </button>
               </div>
            </div>
          )}

          {/* --- KARTALAR (FULL SCREEN SLIDER) --- */}
          {viewMode === 'cards' && activeWallet && (
            <div className="mb-8 px-2 animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#00d4ff] font-bold uppercase text-xs tracking-widest">Hamyon tafsilotlari</h3>
                    <button onClick={onAddWallet} className="text-[#00d4ff] text-xs font-bold flex items-center gap-1 bg-[#00d4ff]/10 px-3 py-1.5 rounded-lg border border-[#00d4ff]/20"><Plus size={14}/> YANGI</button>
                </div>

                {/* PLASTIK KARTA KO'RINISHI */}
                <div 
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, activeWallet, 'wallet'); }} 
                    className="w-full h-[200px] rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10"
                    style={{
                        background: `linear-gradient(135deg, rgba(20,30,60,0.95), rgba(10,14,23,0.95))`,
                    }}
                >
                    {/* Bezak elementlari */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00d4ff]/10 to-transparent rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#ff3366]/10 to-transparent rounded-full blur-[40px] pointer-events-none"></div>

                    <div className="flex justify-between items-start z-10">
                        <span className="text-gray-300 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                             <Wallet size={16} className="text-[#00d4ff]"/> {activeWallet.name}
                        </span>
                        <img src="https://raw.githubusercontent.com/muhwezi/react-credit-cards/master/src/images/chip.png" className="w-10 opacity-70" alt="chip"/>
                    </div>
                    
                    <div className="z-10">
                        <h3 className="text-3xl font-mono text-white tracking-widest drop-shadow-md">
                            {activeWallet.balance.toLocaleString()}
                        </h3>
                        <p className="text-[#00d4ff] text-sm font-bold mt-1 tracking-wider">{activeWallet.currency}</p>
                    </div>

                    <div className="flex justify-between items-end z-10">
                        <p className="text-[10px] text-gray-500 font-mono">**** 4242</p>
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/20"></div>
                            <div className="w-6 h-6 rounded-full bg-white/20 -ml-3"></div>
                        </div>
                    </div>
                </div>
            </div>
          )}
      </div>

      {/* --- TRANZAKSIYALAR --- */}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">
         {viewMode === 'cards' ? (activeWallet?.name + " Tarixi") : "So'nggi Harakatlar"}
      </h3>
      
      <div className="space-y-3 pb-4">
         {sortedTransactions.map(t => {
           const cat = getCategory(t.categoryId);
           return (
             <div 
                key={t.id} 
                onClick={() => onTransactionClick(t)} 
                onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, t, 'tx'); }} 
                className="hud-panel rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:border-[#00d4ff]/30"
             >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#0a0e17] flex items-center justify-center text-[#00d4ff] text-sm font-bold shadow-inner border border-white/5">
                      {cat?.name.slice(0,1)}
                   </div>
                   <div>
                      <h4 className="text-gray-200 font-bold text-sm">{cat?.name}</h4>
                      <p className="text-gray-500 text-[9px] font-bold uppercase mt-0.5">
                        {t.note || data.wallets.find(w => w.id === t.walletId)?.name}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#00d4ff] drop-shadow-[0_0_5px_rgba(0,212,255,0.4)]' : 'text-[#ff3366]'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                   </div>
                   <span className="text-[9px] text-gray-600 block">{t.date}</span>
                </div>
             </div>
           )
         })}
         {/* Scroll uchun bo'sh joy */}
         <div className="h-24"></div> 
      </div>
    </div>
  );
}
