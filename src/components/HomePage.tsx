import { useState, useRef, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import { Wallet, CreditCard, Layers, Plus, Chip } from 'lucide-react'; // Chip ikonkasi kerak
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

const COLORS = ['#00ffff', '#bc13fe', '#ff0055', '#ccff00', '#0099ff'];

export default function HomePage({ data, onNavigate, onTransactionClick, onContextMenu, onAddWallet }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  
  // Carousel uchun indeks
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
  
  // Swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [animClass, setAnimClass] = useState('');

  // 1. Data Prep
  const totalUZS = data.wallets.filter(w => w.currency === 'UZS').reduce((s, w) => s + w.balance, 0);
  const totalUSD = data.wallets.filter(w => w.currency === 'USD').reduce((s, w) => s + w.balance, 0);

  const chartData = data.wallets.map(w => ({
    id: w.id,
    name: w.name,
    value: w.currency === 'USD' ? w.balance * 12800 : w.balance,
    displayBalance: w.balance,
    currency: w.currency
  })).filter(i => i.value > 0);

  // 2. Filtered Transactions (Hozirgi ko'rinib turgan hamyon bo'yicha)
  // Agar 'chart' rejimi bo'lsa -> Barchasi
  // Agar 'cards' rejimi bo'lsa -> Faqat currentWalletIndex dagi hamyon
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
    
    // Chapga surish (Next)
    if (diff > 50) { 
        if (viewMode === 'chart') { setAnimClass('slide-in-right'); setViewMode('cards'); }
        else if (viewMode === 'cards') {
            if (currentWalletIndex < data.wallets.length - 1) {
                setAnimClass('slide-in-right'); setCurrentWalletIndex(prev => prev + 1);
            }
        }
    }
    // O'ngga surish (Prev)
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
      className="h-full flex flex-col overflow-y-auto pt-safe px-4 pb-32" // Scroll uchun joy
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      
      {/* HEADER */}
      <div className="flex justify-between items-start py-6 px-2">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Mavjud Balans</p>
          <h1 className="text-2xl font-bold text-white neon-text drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            {totalUZS.toLocaleString()} <span className="text-sm text-[#00ffff]">UZS</span>
          </h1>
          <h2 className="text-xl font-bold text-[#bc13fe] mt-1 neon-text">
            {totalUSD.toLocaleString()} <span className="text-sm text-gray-500">$</span>
          </h2>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-12 h-12 rounded-full neu-panel flex items-center justify-center active:scale-95">
           <img src={data.profile?.avatar} className="rounded-full w-10 h-10 opacity-80" alt="Av"/>
        </button>
      </div>

      {/* VIEW INDICATOR */}
      <div className="flex justify-center gap-2 mb-6">
         <div className={`h-1 rounded-full transition-all ${viewMode === 'chart' ? 'w-6 bg-[#00ffff]' : 'w-2 bg-gray-700'}`}></div>
         {data.wallets.map((_, i) => (
             <div key={i} className={`h-1 rounded-full transition-all ${viewMode === 'cards' && currentWalletIndex === i ? 'w-6 bg-[#00ffff]' : 'w-2 bg-gray-700'}`}></div>
         ))}
      </div>

      <div className={`flex-1 ${animClass}`}>
          
          {/* --- DIAGRAMMA --- */}
          {viewMode === 'chart' && (
            <div className="flex justify-center mb-8 relative">
               {/* Orqa fon yo'q, faqat bo'laklar */}
               <div className="w-[280px] h-[280px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        onClick={(entry, index) => {
                            // Bosilganda o'sha hamyonga o'tish
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
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            className="cursor-pointer hover:opacity-100 transition-opacity drop-shadow-[0_0_5px_#00ffff]"
                          />
                        ))}
                        {/* Foizlarni ko'rsatish */}
                        <LabelList 
                            dataKey="value" 
                            position="outside" 
                            offset={20}
                            formatter={(val: number) => {
                                const total = chartData.reduce((a,b)=>a+b.value,0);
                                return ((val/total)*100).toFixed(0) + '%';
                            }}
                            style={{fill: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                        />
                      </Pie>
                      {/* Tooltip bosganda/hoverda summa chiqishi uchun */}
                      <Tooltip formatter={(val: number) => val.toLocaleString()} contentStyle={{backgroundColor:'#161a22', borderRadius:'10px', border:'1px solid #333'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* O'rtadagi Statistika Tugmasi */}
                  <button onClick={() => onNavigate('stats')} className="absolute inset-0 m-auto w-32 h-32 rounded-full neu-panel flex flex-col items-center justify-center active:scale-95 z-10">
                    <Layers size={28} className="text-[#00ffff] mb-2"/>
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Statistika</p>
                  </button>
               </div>
            </div>
          )}

          {/* --- FULL SCREEN PLASTIC CARD --- */}
          {viewMode === 'cards' && activeWallet && (
            <div className="mb-8 px-2">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#00ffff] font-bold uppercase text-xs tracking-widest">Hozirgi Hamyon</h3>
                    <button onClick={onAddWallet} className="text-[#00ffff] text-xs font-bold flex items-center gap-1"><Plus size={14}/> YANGI</button>
                </div>

                {/* PLASTIK KARTA */}
                <div 
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, activeWallet, 'wallet'); }} 
                    className="w-full h-[200px] card-plastic card-shine rounded-[24px] p-6 flex flex-col justify-between relative active:scale-[0.98] transition-transform"
                >
                    <div className="flex justify-between items-start z-10">
                        <span className="text-gray-300 text-sm font-bold uppercase tracking-widest">{activeWallet.name}</span>
                        <img src="https://raw.githubusercontent.com/muhwezi/react-credit-cards/master/src/images/chip.png" className="w-10 opacity-80" alt="chip"/>
                    </div>
                    
                    <div className="z-10">
                        <h3 className="text-3xl font-mono text-white tracking-widest shadow-black drop-shadow-md">
                            {activeWallet.balance.toLocaleString()}
                        </h3>
                        <p className="text-[#00ffff] text-sm font-bold mt-1">{activeWallet.currency}</p>
                    </div>

                    <div className="flex justify-between items-end z-10">
                        <p className="text-[10px] text-gray-400 font-mono">**** **** **** 4242</p>
                        <div className="w-8 h-8 rounded-full bg-red-500/80"></div> 
                        {/* Visa/Mastercard logo simulation */}
                    </div>

                    {/* Background Gradient Decoration */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ffff]/20 rounded-full blur-[50px] pointer-events-none"></div>
                </div>
            </div>
          )}
      </div>

      {/* --- TRANZAKSIYALAR (Tegishlisi) --- */}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">
         {viewMode === 'cards' ? (activeWallet?.name + " Tarixi") : "Barcha Harakatlar"}
      </h3>
      
      <div className="space-y-3 pb-4">
         {sortedTransactions.map(t => {
           const cat = data.categories.find(c => c.id === t.categoryId);
           return (
             <div 
                key={t.id} 
                onClick={() => onTransactionClick(t)} 
                onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, t, 'tx'); }} 
                className="neu-panel rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer border border-white/5"
             >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full neu-pressed flex items-center justify-center text-[#00ffff] text-sm font-bold shadow-inner">
                      {cat?.name.slice(0,1)}
                   </div>
                   <div>
                      <h4 className="text-gray-200 font-bold text-sm">{cat?.name}</h4>
                      <p className="text-gray-600 text-[9px] font-bold uppercase mt-0.5">
                        {t.note || data.wallets.find(w => w.id === t.walletId)?.name}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#00ffff]' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                   </div>
                   {/* Sana */}
                   <span className="text-[9px] text-gray-600 block">{t.date}</span>
                </div>
             </div>
           )
         })}
         {/* Bo'sh joy scroll uchun */}
         <div className="h-20"></div> 
      </div>
    </div>
  );
}
