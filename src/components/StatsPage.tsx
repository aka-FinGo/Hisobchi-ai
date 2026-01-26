import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction, Category } from '../types';
import { ChevronRight, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface StatsPageProps {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function StatsPage({ transactions, categories }: StatsPageProps) {
  const [view, setView] = useState<'expense' | 'income'>('expense');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // 1. Vaqt bo'yicha ma'lumotlarni tayyorlash (Oxirgi 7 kun)
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTxs = transactions.filter(t => t.date === date);
      return {
        name: new Date(date).toLocaleDateString('uz-UZ', { weekday: 'short' }),
        income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  // 2. Kategoriyalar bo'yicha taqsimot
  const categoryStats = useMemo(() => {
    return categories
      .filter(c => c.type === view)
      .map(cat => {
        const total = transactions
          .filter(t => t.categoryId === cat.id)
          .reduce((s, t) => s + t.amount, 0);
        return { name: cat.name, value: total, id: cat.id };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, view]);

  const totalAmount = categoryStats.reduce((s, i) => s + i.value, 0);

  // 3. Tanlangan kategoriya ichidagi podkategoriyalar
  const subStats = useMemo(() => {
    if (!selectedCat) return [];
    const cat = categories.find(c => c.id === selectedCat);
    if (!cat) return [];
    
    const catTxs = transactions.filter(t => t.categoryId === selectedCat);
    return (cat.subCategories || ['Boshqa']).map(sub => {
       const total = catTxs
         .filter(t => (t.subCategory === sub) || (!t.subCategory && sub === 'Boshqa'))
         .reduce((s, t) => s + t.amount, 0);
       return { name: sub, value: total };
    }).filter(i => i.value > 0).sort((a,b) => b.value - a.value);
  }, [selectedCat, transactions, categories]);

  return (
    <div className="p-6 pb-32 space-y-8 overflow-y-auto h-full scrollbar-hide">
      <div className="pt-safe flex justify-between items-center">
        <h2 className="text-2xl font-black text-white tracking-tight">Analitika</h2>
        <div className="bg-white/5 p-1 rounded-xl flex border border-white/5">
           <button onClick={() => {setView('expense'); setSelectedCat(null)}} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'expense' ? 'bg-rose-600 text-white' : 'text-gray-500'}`}>Chiqim</button>
           <button onClick={() => {setView('income'); setSelectedCat(null)}} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'income' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>Kirim</button>
        </div>
      </div>

      {/* Area Chart - Dinamika */}
      <div className="glass-card p-5 rounded-[32px]">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Haftalik dinamika</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey={view === 'income' ? 'income' : 'expense'} stroke={view === 'income' ? '#10B981' : '#F43F5E'} strokeWidth={3} fillOpacity={1} fill={`url(${view === 'income' ? '#colorInc' : '#colorExp'})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart & List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-[32px] flex flex-col items-center">
           <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    onClick={(data) => setSelectedCat(data.id)}
                  >
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter">Jami</p>
                 <p className="text-white font-black text-lg">{totalAmount.toLocaleString()}</p>
              </div>
           </div>
        </div>

        <div className="space-y-3">
           {categoryStats.map((item, index) => (
             <div 
               key={item.id} 
               onClick={() => setSelectedCat(item.id)}
               className={`glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 transition-all ${selectedCat === item.id ? 'scale-105 border-blue-500' : 'border-transparent'}`}
               style={{ borderLeftColor: COLORS[index % COLORS.length] }}
             >
                <span className="text-white font-bold text-sm">{item.name}</span>
                <span className="text-gray-400 text-sm font-mono">{item.value.toLocaleString()}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Podkategoriya breakdown (Agar tanlangan bo'lsa) */}
      {selectedCat && subStats.length > 0 && (
        <div className="glass-card p-6 rounded-[32px] animate-slideUp">
           <h3 className="text-white font-bold mb-4 flex items-center gap-2">
             <ChevronRight size={18} className="text-blue-500" /> 
             {categories.find(c => c.id === selectedCat)?.name} bo'yicha batafsil
           </h3>
           <div className="space-y-4">
             {subStats.map(sub => (
               <div key={sub.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-300">{sub.name}</span>
                    <span className="text-white font-bold">{sub.value.toLocaleString()} UZS</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(sub.value / totalAmount) * 100}%` }}
                    ></div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
