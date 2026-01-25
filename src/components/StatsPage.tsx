import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Transaction, Category } from '../types';

interface StatsPageProps {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function StatsPage({ transactions, categories }: StatsPageProps) {
  const [view, setView] = useState<'expense' | 'income'>('expense');

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear && t.type === view;
  });

  const categoryStats = categories
    .filter((c) => c.type === view)
    .map((category) => {
      const total = monthTransactions
        .filter((t) => t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: total,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(thisYear, thisMonth - i, 1);
    return {
      month: date.toLocaleDateString('uz-UZ', { month: 'short' }),
      income: 0,
      expense: 0,
    };
  }).reverse();

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const monthDiff = (thisYear - date.getFullYear()) * 12 + (thisMonth - date.getMonth());
    if (monthDiff >= 0 && monthDiff < 6) {
      const index = 5 - monthDiff;
      if (t.type === 'income') {
        last6Months[index].income += t.amount;
      } else {
        last6Months[index].expense += t.amount;
      }
    }
  });

  const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Statistika</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('expense')}
          className={`flex-1 py-2 rounded-lg font-medium transition-all active:scale-95 ${
            view === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Chiqimlar
        </button>
        <button
          onClick={() => setView('income')}
          className={`flex-1 py-2 rounded-lg font-medium transition-all active:scale-95 ${
            view === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Daromadlar
        </button>
      </div>

      {categoryStats.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400">Shu oy uchun ma'lumot yo'q</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Kategoriyalar bo'yicha
            </h2>
            <div className="flex justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {categoryStats.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {item.value.toLocaleString()} so'm
                    </div>
                    <div className="text-gray-400 text-xs">
                      {((item.value / total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Oxirgi 6 oy
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last6Months}>
                <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Bar dataKey="income" fill="#10B981" />
                <Bar dataKey="expense" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-gray-400 text-sm">Daromad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-gray-400 text-sm">Chiqim</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
