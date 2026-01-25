import { useState } from 'react';
import { Trash2, Edit2, Filter, Calendar, Search } from 'lucide-react';
import { Transaction, Category, Wallet } from '../types';

interface HistoryPageProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void; // Tahrirlash funksiyasi qo'shildi
}

export default function HistoryPage({
  transactions,
  categories,
  wallets,
  onDelete,
  onEdit
}: HistoryPageProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Tranzaksiyalarni saralash
  const filteredTransactions = transactions
    .filter((t) => {
      // 1. Kirim/Chiqim filtri
      if (filter !== 'all' && t.type !== filter) return false;
      
      // 2. Qidiruv (Izoh, summa yoki podkategoriya bo'yicha)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const categoryName = categories.find(c => c.id === t.categoryId)?.name.toLowerCase() || '';
        return (
          t.note?.toLowerCase().includes(searchLower) ||
          t.subCategory?.toLowerCase().includes(searchLower) ||
          t.amount.toString().includes(searchLower) ||
          categoryName.includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryName = (categoryId: string) => 
    categories.find((c) => c.id === categoryId)?.name || 'Noma\'lum';
  
  const getCategoryIcon = (categoryId: string) => 
    categories.find((c) => c.id === categoryId)?.icon || '●';

  const getWalletName = (walletId: string) => 
    wallets.find((w) => w.id === walletId)?.name || 'Hamyon';

  // Sanaga ko'ra guruhlash
  const groupByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach((t) => {
      const date = new Date(t.date).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  };

  const groupedTransactions = groupByDate(filteredTransactions);

  return (
    <div className="p-4 pb-24 pt-safe min-h-full">
      {/* Header va Qidiruv */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 pb-4 space-y-3">
        <h1 className="text-2xl font-bold text-white">Tarix</h1>
        
        {/* Qidiruv maydoni */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Qidirish: zakaz, summa, izoh..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
        </div>

        {/* Filtr tugmalari */}
        <div className="flex bg-gray-800 p-1 rounded-xl">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === type
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'Barchasi' : type === 'income' ? 'Kirim' : 'Chiqim'}
            </button>
          ))}
        </div>
      </div>

      {/* Ro'yxat */}
      <div className="space-y-6 mt-2">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <Filter size={48} className="mx-auto mb-3 opacity-20" />
            <p>Hech narsa topilmadi</p>
          </div>
        ) : (
          Object.keys(groupedTransactions).map((date) => (
            <div key={date}>
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 sticky top-32 bg-gray-900 py-1 w-fit px-2 rounded">
                {date}
              </h3>
              <div className="space-y-2">
                {groupedTransactions[date].map((t) => (
                  <div key={t.id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between border border-gray-700/50">
                    
                    {/* Chap tomon: Info */}
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                          {getCategoryName(t.categoryId)}
                        </span>
                        {/* Agar davr (period) bo'lsa ko'rsatish */}
                        {t.period && t.period !== t.date.slice(0, 7) && (
                          <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Calendar size={8} /> {t.period}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-gray-400 text-xs truncate flex flex-col">
                        <span>{getWalletName(t.walletId)}</span>
                        {/* Podkategoriya yoki Izoh */}
                        {(t.subCategory || t.note) && (
                          <span className="text-gray-500 italic">
                            {t.subCategory ? `• ${t.subCategory} ` : ''}
                            {t.note ? `(${t.note})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* O'ng tomon: Summa va Tugmalar */}
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold whitespace-nowrap ${
                        t.type === 'income' ? 'text-green-400' : 'text-white'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                      </span>

                      {/* Tahrirlash Tugmasi */}
                      <button 
                        onClick={() => onEdit(t.id)}
                        className="p-2 bg-gray-700/50 text-blue-400 rounded-lg active:bg-blue-600 active:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* O'chirish Tugmasi */}
                      <button
                        onClick={() => {
                          if(window.confirm("O'chirilsinmi?")) onDelete(t.id);
                        }}
                        className="p-2 bg-gray-700/50 text-red-400 rounded-lg active:bg-red-600 active:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
