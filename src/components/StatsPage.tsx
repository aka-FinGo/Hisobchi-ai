/**
 * START: STATSPAGE.TSX (1-BO'LIM)
 * Importlar, Filtrlar, Excel Eksport va Swipe Logikasi.
 */

import { useState, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Filter, Download, X, TrendingUp, TrendingDown, Wallet as WalletIcon, Calendar, BrainCircuit } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { AppData, FilterState, Transaction } from '../types';

const COLORS = ['#00d4ff', '#ff3366', '#bb86fc', '#00ff9d', '#ffbf00', '#f472b6'];

interface Props {
  data: AppData;
  initialFilter: FilterState | null;
  onClearFilter: () => void;
  onTxClick: (tx: Transaction) => void;
}

export default function StatsPage({ data, initialFilter, onClearFilter, onTxClick }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'history' | 'ai'>('dashboard');
  const [filter, setFilter] = useState<FilterState>(initialFilter || { type: 'all' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // START: SWIPE LOGIKASI (Tablar o'rtasida surish orqali o'tish)
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 70) {
      if (diff > 0 && tab === 'dashboard') setTab('history');
      else if (diff < 0 && tab === 'history') setTab('dashboard');
    }
  };
  // END: SWIPE LOGIKASI

  // START: EXCELGA EKSPORT (XLSX kutubxonasi yordamida)
  const handleExportExcel = async () => {
    try {
      const exportData = data.transactions.map(t => ({
        Sana: t.date,
        Summa: t.amount,
        Tur: t.type === 'income' ? 'Kirim' : 'Chiqim',
        Hamyon: data.wallets.find(w => w.id === t.walletId)?.name || '-',
        Kategoriya: data.categories.find(c => c.id === t.categoryId)?.name || '-',
        Izoh: t.note || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Hisobot");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      const fileName = `Hisobchi_AI_Export_${new Date().getTime()}.xlsx`;
      await Filesystem.writeFile({
        path: fileName,
        data: excelBuffer,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      alert(`Fayl saqlandi: Documents/${fileName}`);
    } catch (e) {
      console.error("Eksportda xato:", e);
      alert("Eksport qilish uchun ruxsatlarni tekshiring.");
    }
  };
  // END: EXCELGA EKSPORT

  // START: FILTRLASH MANTIQI
  const filteredTxs = useMemo(() => {
    return data.transactions.filter(t => {
      const matchesType = filter.type === 'all' || t.type === filter.type;
      const matchesWallet = !filter.walletId || t.walletId === filter.walletId;
      const matchesCat = !filter.categoryId || t.categoryId === filter.categoryId;
      return matchesType && matchesWallet && matchesCat;
    });
  }, [data.transactions, filter]);
  // END: FILTRLASH MANTIQI

  // ... (Davomi 2-bo'limda)
/**
 * START: STATSPAGE.TSX (2-BO'LIM)
 * Render UI, AreaChart, PieChart va Filtr Modali.
 */

  // START: GRAFIK UCHUN MA'LUMOTLARNI TAYYORLASH
  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredTxs.filter(t => t.type === 'expense').forEach(t => {
      const name = data.categories.find(c => c.id === t.categoryId)?.name || 'Boshqa';
      cats[name] = (cats[name] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filteredTxs, data.categories]);

  const chartData = useMemo(() => {
    return filteredTxs.slice(-10).map(t => ({
      date: t.date.split('-')[2], // Faqat kun
      amount: t.amount
    }));
  }, [filteredTxs]);
  // END: GRAFIK UCHUN MA'LUMOTLAR

  return (
    <div className="h-full flex flex-col bg-background" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* HEADER VA TABLAR */}
      <div className="p-6 pb-2 space-y-4 shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-white italic tracking-tighter">MOLIYAVIY TAHLIL</h2>
          <div className="flex gap-2">
            <button onClick={handleExportExcel} className="p-3 bg-panel rounded-2xl border border-white/5 text-emerald-400 active:scale-90"><Download size={20}/></button>
            <button onClick={() => setIsFilterOpen(true)} className={`p-3 bg-panel rounded-2xl border border-white/5 active:scale-90 ${isFilterOpen ? 'text-neon' : 'text-gray-500'}`}><Filter size={20}/></button>
          </div>
        </div>

        <div className="flex bg-panel p-1 rounded-2xl border border-white/5">
          <button onClick={() => setTab('dashboard')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${tab === 'dashboard' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-gray-500'}`}>DASHBOARD</button>
          <button onClick={() => setTab('history')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${tab === 'history' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-gray-500'}`}>TARIX</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32 scroll-area">
        {tab === 'dashboard' ? (
          <div className="space-y-6 animate-slideUp">
            
            {/* AREA CHART */}
            <div className="bg-panel p-6 rounded-[32px] border border-white/5 h-64 relative overflow-hidden">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Harakatlar Dinamikasi</p>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="amount" stroke="#00d4ff" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                    <XAxis dataKey="date" hide />
                    <ReTooltip contentStyle={{ backgroundColor: '#141e3c', borderRadius: '16px', border: 'none' }} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>

            {/* PIE CHART (KATEGORIYALAR) */}
            <div className="bg-panel p-6 rounded-[32px] border border-white/5 min-h-[300px]">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Xarajatlar Tahlili</p>
               <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-gray-400 truncate">{d.name}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-slideUp">
            {filteredTxs.map(t => (
              <div key={t.id} onClick={() => onTxClick(t)} className="bg-panel p-4 rounded-2xl border border-white/5 flex justify-between items-center active:scale-95 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black ${t.type === 'income' ? 'bg-emerald-400' : 'bg-rose-500'}`}>{t.type === 'income' ? '+' : '-'}</div>
                  <div>
                    <h4 className="text-white text-sm font-bold">{data.categories.find(c => c.id === t.categoryId)?.name}</h4>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{t.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-black">{t.amount.toLocaleString()} UZS</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTR MODALI (Overlay) */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end">
          <div className="w-full bg-panel p-8 rounded-t-[40px] border-t border-white/10 space-y-6 animate-slideUp">
            <div className="flex justify-between items-center">
              <h3 className="text-neon font-black italic">SARALASH</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-500"><X/></button>
            </div>
            
            <div className="space-y-4">
              <select value={filter.walletId || ''} onChange={e => setFilter({...filter, walletId: e.target.value || undefined})} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-xs">
                <option value="">Barcha Hamyonlar</option>
                {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={filter.categoryId || ''} onChange={e => setFilter({...filter, categoryId: e.target.value || undefined})} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-xs">
                <option value="">Barcha Kategoriyalar</option>
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <button onClick={() => { setFilter({type: 'all'}); onClearFilter(); setIsFilterOpen(false); }} className="w-full py-4 text-rose-500 font-bold text-[10px] uppercase">Filtrni Tozalash</button>
            <button onClick={() => setIsFilterOpen(false)} className="w-full py-5 bg-neon text-black rounded-2xl font-black">TASDIQLASH</button>
          </div>
        </div>
      )}
    </div>
  );
}
/** END OF STATSPAGE.TSX */
