import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Filter, Download, Calendar, ArrowUpRight, ArrowDownRight, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppData, FilterState, Transaction } from '../types';

interface Props {
  data: AppData;
  initialFilter: FilterState | null;
  onClearFilter: () => void;
}

export default function StatsPage({ data, initialFilter, onClearFilter }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'history'>('dashboard');
  
  // Filter State
  const [filter, setFilter] = useState<FilterState>({ type: 'all' });

  // Initial Filter kelganda uni qabul qilish
  useEffect(() => {
    if (initialFilter) {
      setFilter({ ...initialFilter, type: 'all' });
      setTab('history');
    }
  }, [initialFilter]);

  // --- FILTERLASH MANTIQI ---
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      // 1. Wallet
      if (filter.walletId && t.walletId !== filter.walletId) return false;
      // 2. Category
      if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
      if (filter.subCategoryId && t.subCategoryId !== filter.subCategoryId) return false;
      if (filter.childCategoryId && t.childCategoryId !== filter.childCategoryId) return false;
      // 3. Location
      if (filter.location && t.note !== filter.location) return false;
      // 4. Date
      if (filter.startDate && t.date < filter.startDate) return false;
      if (filter.endDate && t.date > filter.endDate) return false;
      // 5. Type
      if (filter.type && filter.type !== 'all' && t.type !== filter.type) return false;
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, filter]);

  // --- STATISTIKA (DASHBOARD) ---
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // Oylik Chart Data
    const chartData = filteredTransactions.slice(0, 30).map(t => ({
        date: t.date.slice(5),
        amount: t.amount,
        type: t.type
    })).reverse();

    return { income, expense, chartData };
  }, [filteredTransactions]);

  // --- EXCEL EXPORT ---
  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
        Sana: t.date,
        Summa: t.amount,
        Valyuta: data.wallets.find(w => w.id === t.walletId)?.currency,
        Turi: t.type === 'income' ? 'Kirim' : 'Chiqim',
        Kategoriya: data.categories.find(c => c.id === t.categoryId)?.name || '-',
        Hamyon: data.wallets.find(w => w.id === t.walletId)?.name || '-',
        Izoh: t.note || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hisobot");
    XLSX.writeFile(wb, `Hisobot_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const getCatName = (id?: string) => data.categories.find(c => c.id === id)?.name || 'Barchasi';
  const getWalletName = (id?: string) => data.wallets.find(w => w.id === id)?.name || 'Barchasi';

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] scroll-area pb-32">
       
       {/* HEADER & TABS */}
       <div className="p-6 pb-2">
           <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
               <span className="text-[#00d4ff]">Admin</span> Dashboard 
           </h2>
           <div className="flex p-1 bg-[#141e3c] rounded-xl border border-white/5">
               <button onClick={() => setTab('dashboard')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${tab === 'dashboard' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Umumiy</button>
               <button onClick={() => setTab('history')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${tab === 'history' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Tarix & Filter</button>
           </div>
       </div>

       {/* DASHBOARD */}
       {tab === 'dashboard' && (
           <div className="px-6 space-y-6 animate-slideUp">
               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[#141e3c]/50 p-4 rounded-2xl border-l-4 border-l-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                       <p className="text-gray-500 text-[10px] uppercase font-bold">Kirim</p>
                       <h3 className="text-xl font-bold text-white mt-1">{stats.income.toLocaleString()}</h3>
                       <ArrowUpRight className="text-[#00d4ff] absolute top-4 right-4" size={20}/>
                   </div>
                   <div className="bg-[#141e3c]/50 p-4 rounded-2xl border-l-4 border-l-[#ff3366] shadow-[0_0_15px_rgba(255,51,102,0.1)]">
                       <p className="text-gray-500 text-[10px] uppercase font-bold">Chiqim</p>
                       <h3 className="text-xl font-bold text-white mt-1">{stats.expense.toLocaleString()}</h3>
                       <ArrowDownRight className="text-[#ff3366] absolute top-4 right-4" size={20}/>
                   </div>
               </div>

               <div className="bg-[#141e3c]/50 p-4 rounded-2xl border border-white/5 h-64">
                   <p className="text-gray-500 text-xs font-bold mb-4">Dinamika (So'nggi 30 ta)</p>
                   <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={stats.chartData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                           <XAxis dataKey="date" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false}/>
                           <ReTooltip contentStyle={{background: '#141e3c', border: 'none', borderRadius: '10px'}}/>
                           <Line type="monotone" dataKey="amount" stroke="#00d4ff" strokeWidth={3} dot={false}/>
                       </LineChart>
                   </ResponsiveContainer>
               </div>
               
               <div className="p-4 rounded-2xl border border-dashed border-[#bb86fc]/30 bg-[#bb86fc]/5 flex items-center gap-3">
                   <span className="text-2xl">🤖</span>
                   <div>
                       <h4 className="text-[#bb86fc] font-bold text-sm">AI Bashorati</h4>
                       <p className="text-gray-400 text-xs mt-1">Sizning xarajatlaringiz o'tgan oyga nisbatan <span className="text-[#ff3366] font-bold">12%</span> ga oshishi kutilmoqda.</p>
                   </div>
               </div>
           </div>
       )}

       {/* HISTORY */}
       {tab === 'history' && (
           <div className="flex-1 flex flex-col px-6 animate-slideUp">
               <div className="flex flex-wrap gap-2 mb-4">
                   {filter.walletId && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff] flex items-center gap-1">Hamyon: {getWalletName(filter.walletId)} <X size={10} onClick={() => setFilter({...filter, walletId: undefined})}/></span>}
                   {filter.categoryId && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff] flex items-center gap-1">Kat: {getCatName(filter.categoryId)} <X size={10} onClick={() => setFilter({...filter, categoryId: undefined})}/></span>}
                   {filter.location && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff] flex items-center gap-1">📍 {filter.location} <X size={10} onClick={() => setFilter({...filter, location: undefined})}/></span>}
                   <button onClick={() => { setFilter({type: 'all'}); onClearFilter(); }} className="text-[10px] text-gray-500 underline ml-auto">Tozalash</button>
               </div>

               <div className="bg-[#141e3c]/30 p-4 rounded-2xl border border-white/5 mb-4 space-y-3">
                   <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                       <input type="date" value={filter.startDate || ''} onChange={e => setFilter({...filter, startDate: e.target.value})} className="bg-[#05070a] text-xs text-white p-2 rounded-lg border border-white/10"/>
                       <input type="date" value={filter.endDate || ''} onChange={e => setFilter({...filter, endDate: e.target.value})} className="bg-[#05070a] text-xs text-white p-2 rounded-lg border border-white/10"/>
                   </div>
                   
                   <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-bold">{filteredTransactions.length} ta natija</span>
                        <button onClick={handleExport} className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6b37] px-3 py-2 rounded-lg text-white text-xs font-bold transition-colors">
                            <Download size={14}/> Excel Export
                        </button>
                   </div>
               </div>

               <div className="space-y-3 pb-32">
                   {filteredTransactions.map(t => (
                       <div key={t.id} className="bg-[#141e3c]/50 p-3 rounded-xl border border-white/5 flex justify-between items-center hover:bg-[#1e2a44] transition-colors">
                           <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.type === 'income' ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'bg-[#ff3366]/10 text-[#ff3366]'}`}>
                                   {data.categories.find(c => c.id === t.categoryId)?.name.slice(0,1)}
                               </div>
                               <div>
                                   <p className="text-white text-xs font-bold">{data.categories.find(c => c.id === t.categoryId)?.name}</p>
                                   <p className="text-gray-500 text-[9px]">{t.date} | {data.wallets.find(w => w.id === t.walletId)?.name}</p>
                               </div>
                           </div>
                           <span className={`text-xs font-bold ${t.type === 'income' ? 'text-[#00d4ff]' : 'text-[#ff3366]'}`}>
                               {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                           </span>
                       </div>
                   ))}
                   {filteredTransactions.length === 0 && <div className="text-center text-gray-500 text-xs py-10">Ma'lumot topilmadi</div>}
               </div>
           </div>
       )}
    </div>
  );
}
