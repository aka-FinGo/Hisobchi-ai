import { useState, useEffect } from 'react';
import { X, Check, Calendar, ChevronDown, Plus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { TransactionType, Wallet, Category } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  categories: Category[];
  wallets: Wallet[];
  initialData?: any;
}

const DynamicIcon = ({ name }: { name: string }) => {
  const Icon = (Icons as any)[name] || Icons.Circle;
  return <Icon size={24} />;
};

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Tahrirlash rejimi uchun
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setWalletId(initialData.walletId);
      setDate(initialData.date);
      setNote(initialData.note || '');
    } else {
      // Yangi ochilganda reset
      setAmount('');
      setCategoryId('');
      setWalletId(wallets[0]?.id || '');
      setNote('');
    }
  }, [initialData, isOpen, wallets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[#18181b] rounded-t-[32px] p-6 pb-8 animate-slideUp border-t border-orange-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-lg uppercase tracking-widest">
            {initialData ? 'Tahrirlash' : 'Yangi Amal'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 pb-20">
          
          {/* 1. Summa */}
          <div className="text-center">
             <div className="relative inline-block">
               <input 
                 type="number" 
                 value={amount} 
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0"
                 className="w-full bg-transparent text-5xl font-black text-center text-white focus:outline-none placeholder-white/10 caret-orange-500"
                 autoFocus={!initialData}
               />
               <span className="block text-orange-500 font-bold text-sm mt-1 uppercase tracking-widest">
                 {wallets.find(w => w.id === walletId)?.currency || 'UZS'}
               </span>
             </div>
          </div>

          {/* 2. Tur (Kirim/Chiqim) */}
          <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-500'}`}>Chiqim</button>
            <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500'}`}>Kirim</button>
          </div>

          {/* 3. Hamyonni Tanlash */}
          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Qaysi hamyondan?</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setWalletId(w.id)}
                  className={`shrink-0 px-4 py-3 rounded-xl border transition-all flex flex-col items-start min-w-[120px] ${walletId === w.id ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-white/5 border-transparent text-gray-400'}`}
                >
                  <span className="text-xs font-bold truncate w-full text-left">{w.name}</span>
                  <span className="text-[10px] opacity-70 mt-1">{w.currency}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Kategoriyalar */}
          <div>
            <div className="flex justify-between items-center mb-2">
               <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Kategoriya</label>
               <button className="text-orange-500 text-[10px] font-bold flex items-center gap-1"><Plus size={12}/> Yaratish</button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categories.filter(c => c.type === type).map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-all border ${categoryId === cat.id ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/5 border-transparent text-gray-500'}`}
                >
                  <DynamicIcon name={cat.icon} />
                  <span className="text-[9px] mt-2 font-bold truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Sana va Izoh */}
          <div className="space-y-3">
             <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <Calendar size={18} className="text-gray-500"/>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-white w-full text-sm font-bold focus:outline-none"/>
             </div>
             <input 
               type="text" 
               value={note} 
               onChange={e => setNote(e.target.value)} 
               placeholder="Izoh (ixtiyoriy)..." 
               className="w-full bg-white/5 p-4 rounded-xl text-white text-sm border border-white/5 focus:border-orange-500 focus:outline-none transition-colors"
             />
          </div>

        </div>

        {/* Footer Button */}
        <div className="pt-4 border-t border-white/5">
           <button 
             disabled={!amount || !categoryId || !walletId}
             onClick={() => onSave({ 
               amount: parseFloat(amount), 
               categoryId, 
               walletId, 
               type, 
               date, 
               note,
               id: initialData?.id // Tahrirlashda ID ni saqlab qolish
             })}
             className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl font-black text-white text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
           >
             {initialData ? 'O\'zgarishni Saqlash' : 'Qo\'shish'}
           </button>
        </div>

      </div>
    </div>
  );
}
