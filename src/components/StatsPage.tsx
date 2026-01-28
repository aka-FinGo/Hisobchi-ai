import { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Filter, Download, X, TrendingUp, TrendingDown, Wallet, Calendar, BrainCircuit, Lightbulb, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { AppData, FilterState, Transaction } from '../types';

interface Props {
  data: AppData;
  initialFilter: FilterState | null;
  onClearFilter: () => void;
  onTxClick: (tx: Transaction) => void;
}

const COLORS = ['#00d4ff', '#ff3366', '#bb86fc', '#00ff9d', '#ffbf00', '#f472b6'];

export default function StatsPage({ data, initialFilter, onClearFilter, onTxClick }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'history' | 'ai'>('dashboard');
  const [filter, setFilter] = useState<FilterState>({ type: 'all' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Swipe Logic
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) { // Chapga surganda
        if(tab === 'dashboard') setTab('history');
        else if(tab === 'history') setTab('ai'); 
    } 
    if (diff < -50) { // O'ngga surganda
        if(tab === 'ai') setTab('history');
        else if(tab === 'history') setTab('dashboard');
    }
  };

  useEffect(() => {
    if (initialFilter) {
      setFilter({ ...initialFilter, type: 'all' });
      setTab('history');
    }
  }, [initialFilter]);

  // --- FILTERED DATA ---
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      if (filter.walletId && t.walletId !== filter.walletId) return false;
      if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
      if (filter.subCategoryId && t.subCategoryId !== filter.subCategoryId) return false;
      if (filter.childCategoryId && t.childCategoryId !== filter.childCategoryId) return false;
      if (filter.location && (!t.note || !t.note.toLowerCase().includes(filter.location.toLowerCase()))) return false;
      if (filter.startDate && t.date < filter.startDate) return false;
      if (filter.endDate && t.date > filter.endDate) return false;
      if (filter.type && filter.type !== 'all' && t.type !== filter.type) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, filter]);

  // --- STATISTICS PREP ---
  const stats = useMemo(() => {
    const income = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // Weekly Data
    const weeklyData = [];
    for(let i=6; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayInc = data.transactions.filter(t => t.date === dateStr && t.type === 'income').reduce((s,t)=>s+t.amount,0);
        const dayExp = data.transactions.filter(t => t.date === dateStr && t.type === 'expense').reduce((s,t)=>s+t.amount,0);
        weeklyData.push({ name: dateStr.slice(5), Kirim: dayInc, Chiqim: dayExp });
    }

    // Pie Data
    const catMap: Record<string, number> = {};
    data.transactions.filter(t => t.type === 'expense').forEach(t => {
        const catName = data.categories.find(c => c.id === t.categoryId)?.name || 'Boshqa';
        catMap[catName] = (catMap[catName] || 0) + t.amount;
    });
    const pieData = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] })).sort((a,b)=>b.value-a.value).slice(0, 5);

    // Monthly Trend
    const monthlyData = data.transactions.slice(0, 50).map(t => ({
        date: t.date.slice(5),
        amount: t.type === 'income' ? t.amount : -t.amount,
        income: t.type === 'income' ? t.amount : 0,
        expense: t.type === 'expense' ? t.amount : 0
    })).reverse();

    // Wallet Stats
    const walletData = data.wallets.map(w => ({ name: w.name, balance: w.balance }));

    return { income, expense, weeklyData, pieData, monthlyData, walletData };
  }, [data.transactions]);

  // --- AI ANALYSIS LOGIC ---
  const aiAnalysis = useMemo(() => {
      const topExpenseCat = stats.pieData.length > 0 ? stats.pieData[0] : null;
      const savingsRate = stats.income > 0 ? ((stats.income - stats.expense) / stats.income) * 100 : 0;
      
      const insights = [];
      
      // 1. Tejash
      if (savingsRate > 20) insights.push({ icon: 'good', text: `Barakalla! Siz daromadingizning ${savingsRate.toFixed(0)}% qismini tejab qoldingiz.` });
      else if (savingsRate > 0) insights.push({ icon: 'neutral', text: `Sizda tejash ko'rsatkichi ${savingsRate.toFixed(0)}%. Xarajatlarni optimallashtirish kerak.` });
      else insights.push({ icon: 'bad', text: "Diqqat! Xarajatlaringiz daromaddan oshib ketdi. Budjetni qayta ko'rib chiqing." });

      // 2. Kategoriya
      if (topExpenseCat) {
          insights.push({ icon: 'info', text: `Eng ko'p xarajat "${topExpenseCat.name}" kategoriyasiga to'g'ri kelmoqda (${topExpenseCat.value.toLocaleString()}).` });
      }

      // 3. Faollik
      const today = new Date().toISOString().split('T')[0];
      const todayTxCount = data.transactions.filter(t => t.date === today).length;
      if(todayTxCount === 0) insights.push({ icon: 'neutral', text: "Bugun hali hech qanday amal kiritmadingiz." });

      return insights;
  }, [stats]);


  // --- EXCEL EXPORT (TELEFON UCHUN FIX) ---
  const handleExport = async () => {
    if (filteredTransactions.length === 0) { alert("Yuklash uchun ma'lumot yo'q!"); return; }
    try {
        const exportData = filteredTransactions.map(t => ({
            Sana: t.date, Summa: t.amount, Turi: t.type === 'income' ? 'Kirim' : 'Chiqim',
            Kategoriya: data.categories.find(c => c.id === t.categoryId)?.name || '-',
            Podkategoriya: data.categories.find(c => c.id === t.categoryId)?.subs?.find(s => s.id === t.subCategoryId)?.name || '-',
            Hamyon: data.wallets.find(w => w.id === t.walletId)?.name || '-', Izoh: t.note || ''
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hisobot");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const fileName = `Hisobot_${new Date().toISOString().slice(0,10)}.xlsx`;
        
        await Filesystem.writeFile({ path: fileName, data: wbout, directory: Directory.Documents });
        alert(`Fayl "Documents" papkasiga saqlandi!`);
    } catch (e: any) { alert("Xatolik: Fayl saqlash uchun ruxsat kerak. " + e.message); }
  };

  const getCatName = (id?: string) => data.categories.find(c => c.id === id)?.name || 'Barchasi';

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] scroll-area pb-32" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
       
       {/* HEADER */}
       <div className="p-6 pb-2 sticky top-0 bg-[#0a0e17]/90 z-20 backdrop-blur-md">
           <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
               <span className="text-[#00d4ff]">Admin</span> Dashboard
           </h2>
           <div className="flex p-1 bg-[#141e3c] rounded-xl border border-white/5">
               <button onClick={() => setTab('dashboard')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${tab === 'dashboard' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Umumiy</button>
               <button onClick={() => setTab('history')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${tab === 'history' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Tarix</button>
               <button onClick={() => setTab('ai')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${tab === 'ai' ? 'bg-[#bb86fc] text-[#0a0e17]' : 'text-gray-500'}`}>AI Tahlil</button>
           </div>
       </div>

       {/* DASHBOARD */}
       {tab === 'dashboard' && (
           <div className="px-6 space-y-6 animate-slideUp pb-10">
               {/* Cards */}
               <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 rounded-[24px] relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #007bff 100%)' }}>
                       <TrendingUp className="absolute top-2 right-2 text-white/40" size={32}/>
                       <p className="text-white/80 text-[10px] uppercase font-bold mb-1">Jami Kirim</p>
                       <h3 className="text-xl font-bold text-white">{stats.income.toLocaleString()}</h3>
                   </div>
                   <div className="p-5 rounded-[24px] relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #ff3366 0%, #ff0033 100%)' }}>
                       <TrendingDown className="absolute top-2 right-2 text-white/40" size={32}/>
                       <p className="text-white/80 text-[10px] uppercase font-bold mb-1">Jami Chiqim</p>
                       <h3 className="text-xl font-bold text-white">{stats.expense.toLocaleString()}</h3>
                   </div>
               </div>
               
               {/* Monthly Area Chart */}
                <div className="bg-[#141e3c] rounded-[24px] p-5 border border-white/5 shadow-xl">
                   <h4 className="text-white font-bold text-sm mb-4">Oylik Dinamika</h4>
                   <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyData}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/><stop offset="95%" stopColor="#ff3366" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false}/>
                                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false}/>
                                <ReTooltip contentStyle={{background: '#0a0e17', border:'none', borderRadius: '10px'}}/>
                                <Area type="monotone" dataKey="income" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="expense" stroke="#ff3366" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                   </div>
               </div>

               {/* Weekly Bar Chart */}
               <div className="bg-[#141e3c] rounded-[24px] p-5 border border-white/5 shadow-xl">
                   <h4 className="text-white font-bold text-sm mb-4">Haftalik Faollik</h4>
                   <div className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats.weeklyData}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false}/>
                               <XAxis dataKey="name" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false}/>
                               <ReTooltip contentStyle={{background: '#0a0e17', borderRadius: '10px', border:'none'}}/>
                               <Bar dataKey="Kirim" fill="#00d4ff" radius={[4,4,0,0]}/>
                               <Bar dataKey="Chiqim" fill="#ff3366" radius={[4,4,0,0]}/>
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               </div>

               {/* Category Pie */}
               <div className="bg-[#141e3c] rounded-[24px] p-5 border border-white/5 shadow-xl flex flex-col items-center">
                   <h4 className="text-white font-bold text-sm mb-2 w-full text-left">Top Xarajatlar</h4>
                   <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                <ReTooltip contentStyle={{background: '#0a0e17', borderRadius: '10px', border:'none'}}/>
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                   </div>
               </div>
               
               {/* Wallet Bar */}
               <div className="bg-[#141e3c] rounded-[24px] p-5 border border-white/5 shadow-xl">
                   <h4 className="text-white font-bold text-sm mb-4">Hamyonlar</h4>
                   <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats.walletData} layout="vertical">
                               <XAxis type="number" hide />
                               <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" horizontal={false}/>
                               <ReTooltip contentStyle={{background: '#0a0e17', borderRadius: '10px', border:'none'}}/>
                               <Bar dataKey="balance" fill="#bb86fc" radius={[0,4,4,0]} barSize={20} label={{ position: 'right', fill: '#fff', fontSize: 10 }}/>
                               <XAxis type="category" dataKey="name" tick={{fontSize: 10, fill: '#fff'}} width={70}/>
                           </BarChart>
                        </ResponsiveContainer>
                   </div>
               </div>
           </div>
       )}

       {/* AI TAB */}
       {tab === 'ai' && (
           <div className="px-6 space-y-6 animate-slideUp pb-10">
               <div className="bg-gradient-to-br from-[#141e3c] to-[#0a0e17] p-6 rounded-[30px] border border-[#bb86fc]/20 shadow-[0_0_30px_rgba(187,134,252,0.1)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-[#bb86fc]/10 rounded-full blur-[50px]"></div>
                   <div className="relative z-10 flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 rounded-2xl bg-[#bb86fc] flex items-center justify-center shadow-lg shadow-[#bb86fc]/30"><BrainCircuit size={24} className="text-[#0a0e17]"/></div>
                       <div><h3 className="text-xl font-bold text-white">AI Moliyaviy Maslahatchi</h3><p className="text-[#bb86fc] text-xs">Sizning ma'lumotlaringiz asosida</p></div>
                   </div>
                   <div className="space-y-4">
                       {aiAnalysis.map((item, idx) => (
                           <div key={idx} className="bg-[#0a0e17]/50 p-4 rounded-2xl border border-white/5 flex gap-4">
                               <div className={`mt-1 ${item.icon === 'good' ? 'text-green-400' : item.icon === 'bad' ? 'text-rose-500' : 'text-[#00d4ff]'}`}>
                                   {item.icon === 'good' ? <Lightbulb size={20}/> : item.icon === 'bad' ? <AlertTriangle size={20}/> : <TrendingUp size={20}/>}
                               </div>
                               <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* HISTORY TAB */}
       {tab === 'history' && (
           <div className="flex-1 flex flex-col px-6 animate-slideUp">
               <div className="flex flex-wrap gap-2 mb-4">
                   {(filter.walletId || filter.categoryId || filter.startDate || filter.location) ? (
                        <div className="flex flex-wrap gap-2 items-center w-full">
                            {filter.walletId && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff]">Hamyon: {data.wallets.find(w => w.id === filter.walletId)?.name}</span>}
                            {filter.categoryId && <span className="text-[10px] bg-[#141e3c] border border-white/10 px-2 py-1 rounded-lg text-[#00d4ff]">Kat: {getCatName(filter.categoryId)}</span>}
                            <button onClick={() => { setFilter({type: 'all'}); onClearFilter(); }} className="ml-auto text-xs text-rose-500 font-bold">Tozalash</button>
                        </div>
                   ) : <p className="text-gray-500 text-xs">Barcha amallar</p>}
               </div>
               <div className="flex gap-3 mb-4">
                   <button onClick={() => setIsFilterOpen(true)} className="flex-1 bg-[#141e3c] border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 text-white text-xs font-bold active:scale-95 transition-transform"><Filter size={16} className="text-[#00d4ff]"/> Filterlash</button>
                   <button onClick={handleExport} className="flex-1 bg-[#107c41]/20 border border-[#107c41]/50 py-3 rounded-xl flex items-center justify-center gap-2 text-[#107c41] text-xs font-bold active:scale-95 transition-transform"><Download size={16}/> Excel</button>
               </div>
               <div className="space-y-3 pb-32">
                   {filteredTransactions.map(t => (
                       <div key={t.id} onClick={() => onTxClick(t)} className="bg-[#141e3c]/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-[#1e2a44] active:scale-98 transition-all cursor-pointer shadow-md">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${t.type === 'income' ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'bg-[#ff3366]/10 text-[#ff3366]'}`}>{data.categories.find(c => c.id === t.categoryId)?.name.slice(0,1)}</div>
                               <div><p className="text-white text-xs font-bold mb-0.5">{data.categories.find(c => c.id === t.categoryId)?.name}</p><p className="text-gray-500 text-[10px] font-medium flex items-center gap-1"><Calendar size={10}/> {t.date} | <Wallet size={10}/> {data.wallets.find(w => w.id === t.walletId)?.name}</p></div>
                           </div>
                           <span className={`text-sm font-bold ${t.type === 'income' ? 'text-[#00d4ff]' : 'text-[#ff3366]'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</span>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* FILTER MODAL */}
       {isFilterOpen && (
           <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center animate-slideUp">
               <div className="bg-[#141e3c] w-full max-w-sm h-[80vh] rounded-t-[30px] sm:rounded-[30px] p-6 border-t border-white/10 shadow-2xl overflow-y-auto flex flex-col">
                   <div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-lg">Batafsil Filterlash</h3><button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20} className="text-gray-400"/></button></div>
                   <div className="space-y-5 flex-1">
                       <div><label className="text-gray-500 text-[10px] font-bold uppercase mb-2 block">Vaqt Oralig'i</label><div className="grid grid-cols-2 gap-3"><input type="date" value={filter.startDate || ''} onChange={e => setFilter({...filter, startDate: e.target.value})} className="bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 text-xs"/><input type="date" value={filter.endDate || ''} onChange={e => setFilter({...filter, endDate: e.target.value})} className="bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 text-xs"/></div></div>
                       <div><label className="text-gray-500 text-[10px] font-bold uppercase mb-2 block">Lokatsiya</label><input type="text" value={filter.location || ''} onChange={e => setFilter({...filter, location: e.target.value})} placeholder="Manzil..." className="w-full bg-[#0a0e17] text-white p-4 rounded-xl border border-white/10 text-sm outline-none"/></div>
                       <div><label className="text-gray-500 text-[10px] font-bold uppercase mb-2 block">Turi</label><div className="flex p-1 bg-[#0a0e17] rounded-xl border border-white/10"><button onClick={() => setFilter({...filter, type: 'all'})} className={`flex-1 py-3 rounded-lg text-xs font-bold ${!filter.type || filter.type === 'all' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Barchasi</button><button onClick={() => setFilter({...filter, type: 'income'})} className={`flex-1 py-3 rounded-lg text-xs font-bold ${filter.type === 'income' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Kirim</button><button onClick={() => setFilter({...filter, type: 'expense'})} className={`flex-1 py-3 rounded-lg text-xs font-bold ${filter.type === 'expense' ? 'bg-[#ff3366] text-white' : 'text-gray-500'}`}>Chiqim</button></div></div>
                       <div><label className="text-gray-500 text-[10px] font-bold uppercase mb-2 block">Hamyon</label><select value={filter.walletId || ''} onChange={e => setFilter({...filter, walletId: e.target.value || undefined})} className="w-full bg-[#0a0e17] text-white p-4 rounded-xl border border-white/10 text-sm outline-none"><option value="">Barcha Hamyonlar</option>{data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                       <div><label className="text-gray-500 text-[10px] font-bold uppercase mb-2 block">Kategoriya</label><select value={filter.categoryId || ''} onChange={e => setFilter({...filter, categoryId: e.target.value || undefined})} className="w-full bg-[#0a0e17] text-white p-4 rounded-xl border border-white/10 text-sm outline-none"><option value="">Barcha Kategoriyalar</option>{data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                   </div>
                   <button onClick={() => setIsFilterOpen(false)} className="w-full mt-4 py-4 bg-[#00d4ff] text-[#0a0e17] font-bold rounded-2xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,212,255,0.3)]">Natijani Ko'rish</button>
               </div>
           </div>
       )}
    </div>
  );
}
