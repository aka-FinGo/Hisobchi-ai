import { useState } from 'react';
import { Trash2, Edit2, Search, Filter, Calendar, ChevronRight } from 'lucide-react';
import { Transaction, Category, Wallet } from '../types';
import * as Icons from 'lucide-react';

interface HistoryPageProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const DynamicIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} />;
};

export default function HistoryPage({ transactions, categories, wallets, onDelete, onEdit }: HistoryPageProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions
    .filter((t) => {
      const matchesFilter = filter === 'all' || t.type === filter;
      const categoryName = categories.find(c => c.id === t.categoryId)?.name.toLowerCase() || '';
      const matchesSearch = 
        t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryName.includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm);
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Tranzaksiyalarni sanalar bo'yicha guruhlash
  const grouped = filteredTransactions.reduce((acc: any, t) => {
    const date = t.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Search & Filters */}
      <div className="pt-safe px-6 pb-4 bg-gray-900/40 backdrop-blur-xl border-b border-white/5">
        <h2 className="text-2xl font-black text-white mt-4 mb-6 tracking-tight">Tarix</h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Qidiruv (masalan: bozor, 50000...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500'
              }`}
            >
              {f === 'all' ? 'Hammasi' : f === 'income' ? 'Kirim' : 'Chiqim'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 scrollbar-hide">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>Ma'lumot topilmadi</p>
          </div>
        ) : (
          Object.keys(grouped).map((date) => (
            <div key={date} className="mb-8">
              <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-2">
                {new Date(date).toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              
              <div className="space-y-3">
                {grouped[date].map((t: Transaction) => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  return (
                    <div key={t.id} className="glass-card rounded-3xl p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          <DynamicIcon name={cat?.icon || 'Circle'} />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">
                            {cat?.name} {t.subCategory && <span className="text-gray-500 font-normal">/ {t.subCategory}</span>}
                          </h4>
                          <p className="text-gray-500 text-[10px] font-medium mt-0.5 uppercase tracking-tighter">
                            {wallets.find(w => w.id === t.walletId)?.name} • {t.note || 'Izohsiz'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                            {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                          </p>
                        </div>
                        
                        {/* Actions (Hoverda yoki bosganda chiqadi) */}
                        <div className="flex gap-1">
                          <button onClick={() => onEdit(t.id)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => {if(confirm('Ochirish?')) onDelete(t.id)}} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
