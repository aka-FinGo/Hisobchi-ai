import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction, Category, Wallet } from '../types';

interface HistoryPageProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDelete: (id: string) => void;
}

export default function HistoryPage({
  transactions,
  categories,
  wallets,
  onDelete,
}: HistoryPageProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredTransactions =
    filter === 'all'
      ? sortedTransactions
      : sortedTransactions.filter((t) => t.type === filter);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Noma\'lum';
  };

  const getWalletName = (walletId: string) => {
    return wallets.find((w) => w.id === walletId)?.name || 'Noma\'lum';
  };

  const groupByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach((t) => {
      const date = new Date(t.date).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(t);
    });
    return groups;
  };

  const groupedTransactions = groupByDate(filteredTransactions);

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Tarix</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-lg font-medium transition-all active:scale-95 ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Barchasi
        </button>
        <button
          onClick={() => setFilter('income')}
          className={`flex-1 py-2 rounded-lg font-medium transition-all active:scale-95 ${
            filter === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Daromad
        </button>
        <button
          onClick={() => setFilter('expense')}
          className={`flex-1 py-2 rounded-lg font-medium transition-all active:scale-95 ${
            filter === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Chiqim
        </button>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400">Tranzaksiya topilmadi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, transactions]) => (
            <div key={date}>
              <h3 className="text-sm text-gray-400 mb-3">{date}</h3>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {getCategoryName(transaction.categoryId)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {getWalletName(transaction.walletId)}
                        {transaction.note && ` • ${transaction.note}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-lg font-bold ${
                          transaction.type === 'income'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-gray-400 active:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
