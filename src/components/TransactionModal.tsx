import { useState } from 'react';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Category, Wallet, TransactionType } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: {
    amount: number;
    categoryId: string;
    walletId: string;
    type: TransactionType;
    date: string;
    note?: string;
  }) => void;
  categories: Category[];
  wallets: Wallet[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  wallets,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSave = () => {
    if (!amount || !categoryId || !walletId) return;

    onSave({
      amount: parseFloat(amount),
      categoryId,
      walletId,
      type,
      date,
      note: note || undefined,
    });

    setAmount('');
    setCategoryId('');
    setNote('');
    onClose();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={24} /> : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Tranzaksiya qo'shish</h2>
        <button
          onClick={onClose}
          className="text-gray-400 active:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all active:scale-95 ${
              type === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Chiqim
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all active:scale-95 ${
              type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Daromad
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2 text-sm">Summa</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-gray-800 text-white text-2xl p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            style={{ fontSize: '24px' }}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-3 text-sm">Kategoriya</label>
          <div className="grid grid-cols-4 gap-3">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryId(category.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all active:scale-95 ${
                  categoryId === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                <div className="mb-1">{getIcon(category.icon)}</div>
                <span className="text-xs text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2 text-sm">Hamyon</label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            style={{ fontSize: '16px' }}
          >
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2 text-sm">Sana</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2 text-sm">Izoh (ixtiyoriy)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Izoh yozing..."
            className="w-full bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
            style={{ fontSize: '16px' }}
            rows={3}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
        <button
          onClick={handleSave}
          disabled={!amount || !categoryId || !walletId}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          Saqlash
        </button>
      </div>
    </div>
  );
}
