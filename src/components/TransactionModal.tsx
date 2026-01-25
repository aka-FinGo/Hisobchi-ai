import { useState, useEffect } from 'react';
import { X, CalendarClock } from 'lucide-react';
import { Category, Wallet, Transaction, TransactionType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  categories: Category[];
  wallets: Wallet[];
  initialData?: Transaction | null; // Tahrirlash uchun ma'lumot
}

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData }: Props) {
  const [amount, setAmount] = useState('');
  const [subCategory, setSubCategory] = useState(''); // Podkategoriya
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // "2024-01"
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal ochilganda ma'lumotlarni to'ldirish (Agar tahrirlanayotgan bo'lsa)
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setWalletId(initialData.walletId);
      setDate(initialData.date);
      setSubCategory(initialData.subCategory || '');
      setPeriod(initialData.period || new Date().toISOString().slice(0, 7));
    } else {
      setAmount(''); setCategoryId(''); setSubCategory('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      amount: parseFloat(amount),
      categoryId,
      walletId,
      date,
      subCategory,
      period,
      type: categories.find(c => c.id === categoryId)?.type || 'expense'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border-t border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Tahrirlash' : 'Yangi tranzaksiya'}
          </h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Summa */}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Summa (so'm)"
            className="w-full bg-gray-800 text-2xl font-bold text-white p-4 rounded-xl border border-gray-700 focus:border-blue-500 outline-none"
          />

          {/* Davr (Qaysi oy uchun) */}
          <div className="flex gap-2">
             <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Sanasi</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700"/>
             </div>
             <div className="flex-1">
                <label className="text-xs text-blue-400 block mb-1 flex items-center gap-1"><CalendarClock size={12}/> Qaysi oy hisobidan?</label>
                <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-xl border border-blue-900/50"/>
             </div>
          </div>

          {/* Podkategoriya */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Aniqroq (ixtiyoriy)</label>
            <input 
              type="text" 
              value={subCategory} 
              onChange={e => setSubCategory(e.target.value)} 
              placeholder="Masalan: 123_01 zakaz uchun"
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700"
            />
          </div>

          {/* Kategoriya va Hamyon tanlash (Qisqartirilgan) */}
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700">
            <option value="">Kategoriya tanlang</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700">
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <button onClick={handleSave} disabled={!amount || !categoryId} className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold mt-4">
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
