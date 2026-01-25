import { useState, useEffect } from 'react';
import { X, Check, Calendar, CreditCard, DollarSign, Wallet as WalletIcon } from 'lucide-react';
import * as Icons from 'lucide-react'; // Barcha ikonkalarni import qilamiz
import { TransactionType, Category, Wallet, Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: any) => void;
  categories: Category[];
  wallets: Wallet[];
  initialData?: Transaction | null;
}

// Ikonkani nomi bo'yicha dinamik render qilish komponenti
const DynamicIcon = ({ name, size = 24, className = "" }: { name: string; size?: number; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.HelpCircle size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
};

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  wallets,
  initialData,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const themeColor = type === 'expense' ? 'rose' : 'emerald';
  const bgColor = type === 'expense' ? 'bg-rose-600' : 'bg-emerald-600';
  const textColor = type === 'expense' ? 'text-rose-500' : 'text-emerald-500';
  const borderColor = type === 'expense' ? 'border-rose-500/30' : 'border-emerald-500/30';

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setSubCategory(initialData.subCategory || '');
      setWalletId(initialData.walletId);
      setDate(initialData.date);
      setNote(initialData.note || '');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategoryId('');
    setSubCategory('');
    setWalletId(wallets[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
  };

  const handleSave = () => {
    if (!amount || !categoryId || !walletId) return;
    onSave({
      amount: parseFloat(amount),
      categoryId,
      subCategory: subCategory || undefined,
      walletId,
      type,
      date,
      note,
    });
    resetForm();
  };

  const selectedCategoryData = categories.find(c => c.id === categoryId);
  const hasSubCategories = selectedCategoryData?.subCategories && selectedCategoryData.subCategories.length > 0;
  const filteredCategories = categories.filter(c => c.type === type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl rounded-t-[40px] p-6 pb-safe border-t ${borderColor} shadow-2xl transition-all duration-300 overflow-y-auto max-h-[90vh] scrollbar-hide`}>
        
        {/* Header & Tabs */}
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-white font-bold text-xl">Amaliyot</h2>
           <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white">
             <X size={20} />
           </button>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-full mb-6 relative">
          <div className={`absolute inset-y-1 transition-all duration-300 rounded-full ${bgColor} shadow-lg ${themeColor === 'rose' ? 'shadow-rose-500/20' : 'shadow-emerald-500/20'}`} 
               style={{ left: type === 'expense' ? '4px' : '50%', width: 'calc(50% - 4px)' }}></div>
          <button onClick={() => {setType('expense'); setCategoryId(''); setSubCategory('');}} className={`flex-1 py-3 text-center relative z-10 font-medium transition-colors ${type === 'expense' ? 'text-white' : 'text-gray-400'}`}>Chiqim</button>
          <button onClick={() => {setType('income'); setCategoryId(''); setSubCategory('');}} className={`flex-1 py-3 text-center relative z-10 font-medium transition-colors ${type === 'income' ? 'text-white' : 'text-gray-400'}`}>Kirim</button>
        </div>

        {/* Big Amount Input */}
        <div className="mb-8 text-center relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={`w-full bg-transparent text-5xl font-bold text-center focus:outline-none ${textColor} placeholder-white/20 py-4`}
            autoFocus={!initialData}
          />
          <span className="absolute top-1/2 right-8 -translate-y-1/2 text-gray-500 font-medium">UZS</span>
        </div>

        {/* Categories Grid */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm mb-3 font-medium">Kategoriya</h3>
          <div className="grid grid-cols-4 gap-4">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(cat.id); setSubCategory(''); }}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                  categoryId === cat.id 
                    ? `${bgColor} text-white shadow-lg ${themeColor === 'rose' ? 'shadow-rose-500/30' : 'shadow-emerald-500/30'} scale-105` 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <DynamicIcon name={cat.icon} size={24} className="mb-2" />
                <span className="text-xs truncate w-full text-center font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories (Conditional) */}
        {hasSubCategories && (
          <div className="mb-6 animate-fadeIn">
             <h3 className="text-gray-400 text-sm mb-3 font-medium">{selectedCategoryData.name} turi</h3>
             <div className="flex flex-wrap gap-2">
               {selectedCategoryData.subCategories!.map((sub) => (
                 <button
                   key={sub}
                   onClick={() => setSubCategory(sub)}
                   className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                     subCategory === sub
                       ? `${bgColor} text-white border-transparent shadow-md`
                       : `bg-white/5 text-gray-400 border-white/10 hover:border-white/30`
                   }`}
                 >
                   {sub}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Wallets Slider (Mini Cards) */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm mb-3 font-medium">Hamyon</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => setWalletId(wallet.id)}
                className={`flex-shrink-0 relative w-[120px] h-[70px] rounded-xl p-3 flex flex-col justify-between overflow-hidden transition-all border ${
                  walletId === wallet.id
                    ? `${borderColor} shadow-lg shadow-${themeColor}-500/20`
                    : 'border-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${wallet.colorTheme || 'from-gray-700 to-gray-900'} opacity-20 z-0`}></div>
                <div className="relative z-10 flex justify-between items-start">
                  {wallet.type === 'dollar' ? <DollarSign size={16} className="text-white"/> : wallet.type === 'card' ? <CreditCard size={16} className="text-white"/> : <WalletIcon size={16} className="text-white"/>}
                  {/* XATO SHU YERDA EDI. > belgisi qo'shildi */}
                  {walletId === wallet.id && (
                    <div className={`w-4 h-4 rounded-full ${bgColor} flex items-center justify-center`}>
                      <Check size={10} className="text-white"/>
                    </div>
                  )}
                </div>
                <p className="relative z-10 text-white text-xs font-medium truncate">{wallet.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Note */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-white/10">
            <Calendar size={20} className="text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-full text-sm"
            />
          </div>
          <div className="flex-[1.5] bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-white/10">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Izoh..."
              className="bg-transparent text-white focus:outline-none w-full text-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!amount || !categoryId}
          className={`w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg ${bgColor} ${themeColor === 'rose' ? 'shadow-rose-500/30' : 'shadow-emerald-500/30'} disabled:opacity-50 disabled:shadow-none`}
        >
          <Check size={24} /> Saqlash
        </button>

      </div>
    </div>
  );
}
