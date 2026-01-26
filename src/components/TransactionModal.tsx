import { useState, useEffect } from 'react';
import { X, Check, Calendar, ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Category, Wallet, TransactionType } from '../types';

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData }: any) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');

  if (!isOpen) return null;

  const DynamicIcon = ({ name }: { name: string }) => {
    const Icon = (Icons as any)[name] || Icons.Circle;
    return <Icon size={24} />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md glass-neon rounded-t-[40px] p-8 animate-slideUp">
        
        {/* Summa Maydoni */}
        <div className="text-center mb-8">
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-6xl font-black text-center text-white focus:outline-none placeholder-white/10"
          />
          <p className="text-blue-400 font-bold uppercase tracking-widest mt-2">UZS / {type}</p>
        </div>

        {/* Kirim/Chiqim Selector */}
        <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
          <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'expense' ? 'bg-rose-600 shadow-lg shadow-rose-600/30' : 'text-gray-500'}`}>Chiqim</button>
          <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'income' ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30' : 'text-gray-500'}`}>Kirim</button>
        </div>

        {/* Kategoriyalar Grid (Icons) */}
        <div className="grid grid-cols-4 gap-4 mb-8 max-h-48 overflow-y-auto scrollbar-hide">
          {categories.filter((c: any) => c.type === type).map((cat: any) => (
            <button 
              key={cat.id} 
              onClick={() => { setCategoryId(cat.id); setSubCategory(''); }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${categoryId === cat.id ? 'bg-blue-600 scale-110 shadow-lg shadow-blue-600/40' : 'bg-white/5 text-gray-400'}`}
            >
              <DynamicIcon name={cat.icon} />
              <span className="text-[10px] mt-2 font-bold truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Saqlash */}
        <button 
          onClick={() => onSave({ amount: Number(amount), categoryId, walletId, type, date: new Date().toISOString().split('T')[0], subCategory })}
          className="w-full py-4 neon-btn-purple rounded-2xl font-black text-lg uppercase tracking-tighter"
        >
          Tranzaksiyani Muhrlash
        </button>
      </div>
    </div>
  );
}
