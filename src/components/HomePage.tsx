import { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LabelList, Sector } from 'recharts';
import { Wallet, Layers, Plus, RefreshCw } from 'lucide-react';
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
  onRefresh: () => void;
}

const HUD_COLORS = ['#ff3366', '#00d4ff', '#bb86fc', '#00ff9d', '#ffbf00'];

// --- CUSTOM TOOLTIP ---
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

// --- ACTIVE SHAPE (Tanishda kattalashish effekti) ---
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      {/* Asosiy bo'lak (Kattalashtirilgan radius bilan) */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // +8px ga kattalashadi (Markazdan qochadi)
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" // Soya beramiz
        cornerRadius={6}
      />
      {/* Yaltiroq effekt (ixtiyoriy) */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 6}
        fill={fill}
        opacity={0.5}
        cornerRadius={10}
      />
    </g>
  );
};

export default function HomePage({ data, onNavigate, onTransactionClick, onContextMenu, onAddWallet, onRefresh }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined); // Diagramma uchun

  // Pull-to-Refresh & Swipe States
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animClass, setAnimClass] = useState('');

  // Safety
  useEffect(() => {
    if (currentWalletIndex >= data.wallets.length) setCurrentWalletIndex(0);
  }, [data.wallets.length]);

  const totalUZS = data.wallets.filter(w => w.currency === 'UZS').reduce((s, w) => s + w.balance, 0);
  const totalUSD = data.wallets.filter(w => w.currency === 'USD').reduce((s, w) => s + w.balance, 0);
  const totalWealth = data.wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12800 : w.balance), 0);

  const chartData = data.wallets.map((w, index) => {
    const valInUZS = w.currency === 'USD' ? w.balance * 12800 : w.balance;
    return {
      id: w.id,
      name: w.name,
      value: valInUZS,
      currency: w.currency,
      fill: HUD_COLORS[index % HUD_COLORS.length],
      percent: totalWealth > 0 ? Math.round((valInUZS / totalWealth) * 100) : 0
    };
  }).filter(i => i.value > 0);

  const activeWallet = viewMode === 'cards' && data.wallets.length > 0 ? data.wallets[Math.min(currentWalletIndex, data.wallets.length - 1)] : null;
  const displayedTransactions = activeWallet ? data.transactions.filter(t => t.walletId === activeWallet.id) : data.transactions;
  const sortedTransactions = [...displayedTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const getCategory = (id: string) => data.categories.find(c => c.id === id);

  // --- HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
     touchStartX.current = e.targetTouches[0].clientX;
     touchStartY.current = e.targetTouches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
     const diffY = e.targetTouches[0].clientY - touchStartY.current;
     if (e.currentTarget.scrollTop === 0 && diffY > 0) setPullY(diffY);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (pullY > 100) {
       setIsRefreshing(true); setPullY(50);
       setTimeout(() => { onRefresh(); setIsRefreshing(false); setPullY(0); }, 1000);
    } else { setPullY(0); }

    if (pullY < 50) {
        if (diffX > 50) { 
            if (viewMode === 'chart') { setAnimClass('slide-in-right'); setViewMode('cards'); }
            else if (viewMode === 'cards' && currentWalletIndex < data.wallets.length - 1) { setAnimClass('slide-in-right'); setCurrentWalletIndex(p => p + 1); }
        }
        if (diffX < -50) { 
            if (viewMode === 'cards') {
                if (currentWalletIndex > 0) { setAnimClass('slide-in-left'); setCurrentWalletIndex(p => p - 1); } 
                else { setAnimClass('slide-in-left'); setViewMode('chart'); }
            }
        }
    }
    setTimeout(() => setAnimClass(''), 300);
  };

  return (
    <div 
        className="h-full flex flex-col overflow-y-auto pt-safe px-4 pb-48 relative transition-transform duration-300"
        style={{ transform: `translateY(${pullY > 0 ? Math.min(pullY, 150) / 2 : 0}px)` }} 
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onClick={() => setActiveIndex(undefined)} // Bo'sh joy bosilganda reset
    >
      {pullY > 0 && (<div className="absolute top-[-40px] left-0 right-0 flex justify-center items-center h-10"><RefreshCw className={`text-[#00d4ff] ${isRefreshing ? 'animate-spin' : ''}`} size={24}/></div>)}

      {/* HEADER */}
      <div className="flex justify-between items-start py-6 px-2">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Jami Mablag'</p>
          <h1 className="text-3xl font-bold text-white tracking-wider chart-neon-glow">{totalUZS.toLocaleString()} <span className="text-sm text-[#00d4ff]">UZS</span></h1>
          <h2 className="text-xl font-bold text-[#bb86fc] mt-1 chart-neon-glow">{totalUSD.toLocaleString()} <span className="text-sm text-gray-500">$</span></h2>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full hud-panel flex items-center justify-center active:scale-95 border border-white/10"><img src={data.profile?.avatar} className="rounded-full w-10 h-10 opacity-90"/></button>
      </div>

      <div className={`flex-1 ${animClass}`}>
          {viewMode === 'chart' && (
            <div className="flex justify-center mb-8 relative pt-4">
               
               {/* 3D Container (Qalin va bo'rtib chiqqan) */}
               <div className="w-[300px] h-[300px] relative chart-3d-wrapper flex items-center justify-center">
                  
                  {/* Chart Ichki Soya */}
                  <div className="chart-inner-shadow"></div>

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {/* TASHQI 3D HALQA */}
                      <Pie 
                        activeIndex={activeIndex} // State
                        activeShape={renderActiveShape} // Custom Shape (Kattalashish uchun)
                        data={chartData} 
                        innerRadius={90} 
                        outerRadius={115} 
                        paddingAngle={6} 
                        cornerRadius={6} 
                        dataKey="value" 
                        stroke="none" 
                        onClick={(entry, index, e) => {
                            e.stopPropagation();
                            setActiveIndex(index); // Tanlash
                            if (activeIndex === index) {
                                const wIndex = data.wallets.findIndex(w => w.id === entry.id);
                                if(wIndex >= 0) { setCurrentWalletIndex(wIndex); setAnimClass('slide-in-right'); setViewMode('cards'); }
                            }
                        }}
                      >
                        {chartData.map((e, i) => (
                           <Cell key={i} fill={e.fill} className="cursor-pointer"/>
                        ))}
                        
                        {/* FOIZLAR (Label List) */}
                        <LabelList 
                            dataKey="percent" 
                            position="outside" 
                            offset={20}
                            formatter={(val: number) => val > 2 ? `${val}%` : ''}
                            style={{ fill: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '0 0 5px black' }}
                        />
                      </Pie>

                      {/* ICHKI NEON CHIZIQ (Doimiy) */}
                      <Pie data={chartData} innerRadius={82} outerRadius={84} dataKey="value" stroke="none" isAnimationActive={false}>
                        {chartData.map((e, i) => <Cell key={i} fill={e.fill} className="chart-neon-glow"/>)}
                      </Pie>
                      
                      {/* Tooltip */}
                      <Tooltip 
                        content={<CustomTooltip />} 
                        active={typeof activeIndex === 'number'} 
                        position={{ x: 75, y: 120 }} 
                        wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Markaziy Tugma */}
                  <button onClick={(e) => { e.stopPropagation(); onNavigate('stats'); }} className="absolute m-auto w-32 h-32 rounded-full hud-pressed flex flex-col items-center justify-center active:scale-95 z-10 border border-[#00d4ff]/20">
                    <Layers size={28} className="text-[#00d4ff] mb-2 drop-shadow-[0_0_5px_#00d4ff]"/>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Statistika</p>
                  </button>
               </div>
            </div>
          )}

          {/* CARDS VIEW */}
          {viewMode === 'cards' && activeWallet && (
            <div className="mb-8 px-2 animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#00d4ff] font-bold uppercase text-xs tracking-widest">Hamyon tafsilotlari</h3>
                    <button onClick={onAddWallet} className="text-[#00d4ff] text-xs font-bold flex items-center gap-1 bg-[#00d4ff]/10 px-3 py-1.5 rounded-lg border border-[#00d4ff]/20"><Plus size={14}/> YANGI</button>
                </div>
                <div onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, activeWallet, 'wallet'); }} className="w-full h-[200px] rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10" style={{ background: `linear-gradient(135deg, rgba(20,30,60,0.95), rgba(10,14,23,0.95))` }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00d4ff]/10 to-transparent rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="flex justify-between items-start z-10"><span className="text-gray-300 text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Wallet size={16} className="text-[#00d4ff]"/> {activeWallet.name}</span><img src="https://raw.githubusercontent.com/muhwezi/react-credit-cards/master/src/images/chip.png" className="w-10 opacity-70"/></div>
                    <div className="z-10"><h3 className="text-3xl font-mono text-white tracking-widest drop-shadow-md">{activeWallet.balance.toLocaleString()}</h3><p className="text-[#00d4ff] text-sm font-bold mt-1 tracking-wider">{activeWallet.currency}</p></div>
                    <div className="flex justify-between items-end z-10"><p className="text-[10px] text-gray-500 font-mono">**** 4242</p></div>
                </div>
            </div>
          )}
      </div>

      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">{viewMode === 'cards' ? (activeWallet?.name + " Tarixi") : "So'nggi Harakatlar"}</h3>
      <div className="space-y-3 pb-4">
         {sortedTransactions.map(t => {
           const cat = getCategory(t.categoryId);
           return (
             <div key={t.id} onClick={() => onTransactionClick(t)} onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, t, 'tx'); }} className="hud-panel rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:border-[#00d4ff]/30">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#0a0e17] flex items-center justify-center text-[#00d4ff] text-sm font-bold shadow-inner border border-white/5">{cat?.name.slice(0,1)}</div><div><h4 className="text-gray-200 font-bold text-sm">{cat?.name}</h4><p className="text-gray-500 text-[9px] font-bold uppercase mt-0.5">{t.note || data.wallets.find(w => w.id === t.walletId)?.name}</p></div></div>
                <div className="text-right"><div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#00d4ff]' : 'text-[#ff3366]'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</div><span className="text-[9px] text-gray-600 block">{t.date}</span></div>
             </div>
           )
         })}
         <div className="h-24"></div>
      </div>
    </div>
  );
}
