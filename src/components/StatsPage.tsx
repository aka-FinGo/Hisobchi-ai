import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Filter, Download, X, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppData, FilterState, Transaction } from '../types';

interface Props {
  data: AppData;
  initialFilter: FilterState | null;
  onClearFilter: () => void;
  onTxClick: (tx: Transaction) => void; // YANGI PROP
}

export default function StatsPage({ data, initialFilter, onClearFilter, onTxClick }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'history'>('dashboard');
  
  // Filter State
  const [filter, setFilter] = useState<FilterState>({ type: 'all' });
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Filter Modal

  useEffect(() => {
    if (initialFilter) {
      setFilter({ ...initialFilter, type: 'all' });
      setTab('history');
    }
  }, [initialFilter]);

  // --- FILTER LOGIC ---
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      if (filter.walletId && t.walletId !== filter.walletId) return false;
      if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
      if (filter.location && t.note !== filter.location) return false;
      if (filter.startDate && t.date < filter.startDate) return false;
      if (filter.endDate && t.date > filter.endDate) return false;
      if (filter.type && filter.type !== 'all' && t.type !== filter.type) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, filter]);

  // --- DASHBOARD STATS ---
  const stats = useMemo(() => {
    // Joriy oy
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(today.getMonth() - 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    const income = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // Oylik Chart Data (Hope UI Style - Smooth)
    const chartData = data.transactions.slice(0, 50).map(t => ({
        date: t.date.slice(5),
        amount: t.type === 'income' ? t.amount : -t.amount, // Balance effect
        income: t.type === 'income' ? t.amount : 0,
        expense: t.type === 'expense' ? t.amount : 0
    })).reverse();

    // AI Prediction (Stabil Mantiq)
    const curMonthExp = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const lastMonthExp = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(lastMonth)).reduce((s, t) => s + t.amount, 0);
    
    let predictionText = "Ma'lumotlar yig'ilmoqda...";
    let predictionTrend = 'neutral';
    
    if (lastMonthExp > 0) {
        const diff = curMonthExp - lastMonthExp;
        const percent = Math.round((diff / lastMonthExp) * 100);
        if (diff > 0) {
            predictionText = `Diqqat! Bu oy xarajatlaringiz o'tgan oyga nisbatan ${percent}% ga oshib ketdi. Tejashni maslahat beraman.`;
            predictionTrend = 'bad';
        } else {
            predictionText = `Ajoyib! Bu oy xarajatlaringiz o'tgan oyga nisbatan ${Math.abs(percent)}% ga kam.`;
            predictionTrend = 'good';
        }
    } else if (curMonthExp > 0) {
        predictionText = "Bu oy faol xarajat qilyapsiz. Nazoratni qo'ldan boy bermang.";
        predictionTrend = 'neutral';
    }

    return { income, expense, chartData, predictionText, predictionTrend };
  }, [data.transactions]);

  // Excel Export
  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
        Sana: t.date, Summa: t.amount, Turi: t.type === 'income' ? 'Kirim' : 'Chiqim',
        Kategoriya: data.categories.find(c => c.id === t.categoryId)?.name || '-',
        Hamyon: data.wallets.find(w => w.id === t.walletId)?.name || '-', Izoh: t.note || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hisobot");
    XLSX.writeFile(wb, `Hisobot_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const getCatName = (id?: string) => data.categories.find(c => c.id === id)?.name || 'Barchasi';

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] scroll-area pb-32">
       
       {/* HEADER */}
       <div className="p-6 pb-2 sticky top-0 bg-[#0a0e17]/90 z-20 backdrop-blur-md">
           <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
               <span className="text-[#00d4ff]">Admin</span> Dashboard
           </h2>
           <div className="flex p-1 bg-[#141e3c] rounded-xl border border-white/5">
               <button onClick={() => setTab('dashboard')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${tab === 'dashboard' ? 'bg-[#00d4ff] text-[#0a0e17] shadow-lg shadow-[#00d4ff]/20' : 'text-gray-500'}`}>Umumiy</button>
               <button onClick={() => setTab('history')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${tab === 'history' ? 'bg-[#00d4ff] text-[#0a0e17] shadow-lg shadow-[#00d4ff]/20' : 'text-gray-500'}`}>Tarix & Filter</button>
           </div>
       </div>

       {/* DASHBOARD (HOPE UI STYLE) */}
       {tab === 'dashboard' && (
           <div className="px-6 space-y-6 animate-slideUp">
               
               {/* 1. KARTALAR (Gradient) */}
               <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 rounded-[24px] relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #007bff 100%)' }}>
                       <div className="absolute top-0 right-0 p-3 opacity-30"><TrendingUp size={40} color="white"/></div>
                       <p className="text-white/80 text-[10px] uppercase font-bold mb-1">Jami Kirim</p>
                       <h3 className="text-2xl font-bold text-white">{stats.income.toLocaleString()}</h3>
                       <p className="text-white/60 text-[10px] mt-2">+12% o'tgan oyga nisbatan</p>
                   </div>
                   <div className="p-5 rounded-[24px] relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #ff3366 0%, #ff0033 100%)' }}>
                       <div className="absolute top-0 right-0 p-3 opacity-30"><TrendingDown size={40} color="white"/></div>
                       <p className="text-white/80 text-[10px] uppercase font-bold mb-1">Jami Chiqim</p>
                       <h3 className="text-2xl font-bold text-white">{stats.expense.toLocaleString()}</h3>
                       <p className="text-white/60 text-[10px] mt-2">-5% o'tgan oyga nisbatan</p>
                   </div>
               </div>

               {/* 2. AREA CHART (Smooth) */}
               <div className="bg-[#141e3c] rounded-[24px] p-5 border border-white/5 shadow-xl">
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-bold text-sm">Moliyaviy Oqim</h4>
                        <span className="text-[10px] text-gray-400 bg-black/20 px-2 py-1 rounded">30 kun</span>
                   </div>
                   <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false}/>
                                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false}/>
                                <ReTooltip contentStyle={{background: '#0a0e17', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 30px black'}} itemStyle={{fontSize: '12px'}}/>
                                <Area type="monotone" dataKey="income" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="expense" stroke="#ff3366" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                   </div>
               </div>
               
               {/* 3. STABIL AI (Heuristic) */}
               <div className="p-5 rounded-[24px] bg-gradient-to-r from-[#141e3c] to-[#1e2a44] border border-[#00d4ff]/20 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/10 rounded-full blur-[40px] pointer-events-none"></div>
                   <div className="flex items-start gap-4 z-10 relative">
                       <div className="p-3 bg-[#00d4ff]/10 rounded-2xl text-2xl">🤖</div>
                       <div>
                           <h4 className="text-white font-bold text-sm mb-1">AI Tahlilchi</h4>
                           <p className="text-gray-400 text-xs leading-relaxed">{stats.predictionText}</p>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* HISTORY */}
       {tab === 'history' && (
           <div className="flex-1 flex flex-col px-6 animate-slideUp">
               
               {/* Active Filters Panel */}
               <div className="flex flex-wrap gap-2 mb-4">
                   {/* Filterni ko'rsatish */}
                   {(filter.walletId || filter.categoryId || filter.startDate) ? (
                        <div className="flex flex-wrap gap-2 items-center w-full">
                            {filter.walletId && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff]">Hamyon: {data.wallets.find(w => w.id === filter.walletId)?.name}</span>}
                            {filter.categoryId && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff]">Kat: {getCatName(filter.categoryId)}</span>}
                            {filter.startDate && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff]">{filter.startDate} - {filter.endDate}</span>}
                            <button onClick={() => { setFilter({type: 'all'}); onClearFilter(); }} className="ml-auto text-xs text-rose-500 font-bold">Tozalash</button>
                        </div>
                   ) : <p className="text-gray-500 text-xs">Barcha amallar ko'rsatilmoqda</p>}
               </div>

               {/* TOOLBAR */}
               <div className="flex gap-3 mb-4">
                   <button onClick={() => setIsFilterOpen(true)} className="flex-1 bg-[#141e3c] border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 text-white text-xs font-bold active:scale-95 transition-transform">
                       <Filter size={16} className="text-[#00d4ff]"/> Filterlash
                   </button>
                   <button onClick={handleExport} className="flex-1 bg-[#107c41]/20 border border-[#107c41]/50 py-3 rounded-xl flex items-center justify-center gap-2 text-[#107c41] text-xs font-bold active:scale-95 transition-transform">
                       <Download size={16}/> Excel
                   </button>
               </div>

               {/* TRANSACTION LIST */}
               <div className="space-y-3 pb-32">
                   {filteredTransactions.map(t => (
                       <div key={t.id} onClick={() => onTxClick(t)} // CLICK HANDLER
                            className="bg-[#141e3c]/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-[#1e2a44] active:scale-98 transition-all cursor-pointer">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${t.type === 'income' ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'bg-[#ff3366]/10 text-[#ff3366]'}`}>
                                   {data.categories.find(c => c.id === t.categoryId)?.name.slice(0,1)}
                               </div>
                               <div>
                                   <p className="text-white text-xs font-bold mb-0.5">{data.categories.find(c => c.id === t.categoryId)?.name}</p>
                                   <p className="text-gray-500 text-[10px] font-medium flex items-center gap-1">
                                       <Calendar size={10}/> {t.date} | <Wallet size={10}/> {data.wallets.find(w => w.id === t.walletId)?.name}
                                   </p>
                               </div>
                           </div>
                           <span className={`text-sm font-bold ${t.type === 'income' ? 'text-[#00d4ff]' : 'text-[#ff3366]'}`}>
                               {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                           </span>
                       </div>
                   ))}
                   {filteredTransactions.length === 0 && (
                       <div className="flex flex-col items-center justify-center py-10 opacity-50">
                           <Search size={40} className="text-gray-500 mb-2"/>
                           <p className="text-gray-500 text-xs">Hech narsa topilmadi</p>
                       </div>
                   )}
               </div>
           </div>
       )}

       {/* FILTER POPUP MODAL */}
       {isFilterOpen && (
           <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-slideUp">
               <div className="bg-[#141e3c] w-full max-w-sm rounded-t-[30px] sm:rounded-[30px] p-6 border-t border-white/10 shadow-2xl">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-white font-bold text-lg">Filterlash</h3>
                       <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20} className="text-gray-400"/></button>
                   </div>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Vaqt Oralig'i</label>
                           <div className="grid grid-cols-2 gap-3">
                               <input type="date" value={filter.startDate || ''} onChange={e => setFilter({...filter, startDate: e.target.value})} className="bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 text-xs outline-none focus:border-[#00d4ff]"/>
                               <input type="date" value={filter.endDate || ''} onChange={e => setFilter({...filter, endDate: e.target.value})} className="bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 text-xs outline-none focus:border-[#00d4ff]"/>
                           </div>
                       </div>
                       
                       <div>
                           <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Turi</label>
                           <div className="flex p-1 bg-[#0a0e17] rounded-xl border border-white/10">
                               <button onClick={() => setFilter({...filter, type: 'all'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter.type === 'all' || !filter.type ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Barchasi</button>
                               <button onClick={() => setFilter({...filter, type: 'income'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter.type === 'income' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Kirim</button>
                               <button onClick={() => setFilter({...filter, type: 'expense'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter.type === 'expense' ? 'bg-[#ff3366] text-white' : 'text-gray-500'}`}>Chiqim</button>
                           </div>
                       </div>
                   </div>

                   <button onClick={() => setIsFilterOpen(false)} className="w-full mt-8 py-4 bg-[#00d4ff] text-[#0a0e17] font-bold rounded-2xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                       Natijani Ko'rish
                   </button>
               </div>
           </div>
       )}
    </div>
  );
}
