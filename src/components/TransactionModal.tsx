import { useState, useEffect } from 'react';
import { X, ArrowLeft, MapPin, Plus, DollarSign } from 'lucide-react';
import { TransactionType, Wallet, Category, Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Transaction) => void;
  categories: Category[];
  wallets: Wallet[];
  initialData?: Transaction | null;
  onAddCategory: (cat: Category) => void;
}

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData, onAddCategory }: Props) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [exchangeRate, setExchangeRate] = useState('12800'); // Default kurs
  
  const [catId, setCatId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Tahrirlash rejimini yuklash
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setWalletId(initialData.walletId);
      setExchangeRate(initialData.exchangeRate?.toString() || '12800');
      setCatId(initialData.categoryId);
      setDate(initialData.date);
      setNote(initialData.note || '');
      setStep(3);
    } else {
      setAmount('');
      setWalletId(wallets[0]?.id || '');
      setStep(1);
    }
  }, [initialData, isOpen]);

  const selectedWallet = wallets.find(w => w.id === walletId);
  const isUSD = selectedWallet?.currency === 'USD';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0f14]/95 backdrop-blur-xl flex flex-col animate-slideUp">
      <div className="p-4 flex justify-between items-center border-b border-white/5">
         {step > 1 && <button onClick={() => setStep(step-1)}><ArrowLeft className="text-[#2ef2ff]"/></button>}
         <h2 className="text-white font-bold uppercase tracking-widest text-neon">
            {step === 1 ? 'Summa' : step === 2 ? 'Hamyon' : 'Tafsilotlar'}
         </h2>
         <button onClick={onClose} className="p-2 neu-panel rounded-full text-gray-400"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
         
         {/* STEP 1: SUMMA */}
         {step === 1 && (
             <div className="text-center mt-10">
                 <input 
                   type="number" 
                   value={amount} 
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0"
                   className="w-full bg-transparent text-5xl font-bold text-center text-white focus:outline-none placeholder-gray-800 text-neon caret-[#2ef2ff]"
                   autoFocus
                 />
                 <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => setType('expense')} className={`px-8 py-3 rounded-xl font-bold transition-all ${type === 'expense' ? 'neu-pressed text-rose-400 shadow-[inset_0_0_10px_rgba(244,63,94,0.2)]' : 'neu-panel text-gray-500'}`}>CHIQIM</button>
                    <button onClick={() => setType('income')} className={`px-8 py-3 rounded-xl font-bold transition-all ${type === 'income' ? 'neu-pressed text-[#2ef2ff] shadow-[inset_0_0_10px_rgba(46,242,255,0.2)]' : 'neu-panel text-gray-500'}`}>KIRIM</button>
                 </div>
                 <button disabled={!amount} onClick={() => setStep(2)} className="w-full mt-10 py-4 neu-panel rounded-2xl text-[#2ef2ff] font-bold uppercase disabled:opacity-50">DAVOM ETISH</button>
             </div>
         )}

         {/* STEP 2: HAMYON */}
         {step === 2 && (
             <div className="space-y-4">
                 {wallets.map(w => (
                     <button 
                        key={w.id} 
                        onClick={() => { setWalletId(w.id); setStep(3); }}
                        className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${walletId === w.id ? 'neu-pressed border border-[#2ef2ff]/30' : 'neu-panel'}`}
                     >
                        <div className="text-left">
                           <p className={`font-bold ${walletId === w.id ? 'text-[#2ef2ff]' : 'text-gray-300'}`}>{w.name}</p>
                           <p className="text-xs text-gray-500">{w.type.toUpperCase()}</p>
                        </div>
                        <p className="font-bold text-gray-400">{w.currency}</p>
                     </button>
                 ))}
             </div>
         )}

         {/* STEP 3: KURS, KATEGORIYA, SANA */}
         {step === 3 && (
             <div className="space-y-6">
                 
                 {/* KURS INPUTI (Faqat USD hamyon uchun) */}
                 {isUSD && (
                    <div className="bg-[#161a22] p-4 rounded-2xl border border-yellow-500/30 animate-pulse-slow">
                        <label className="text-yellow-500 text-xs font-bold uppercase mb-2 block flex items-center gap-2">
                           <DollarSign size={14}/> Kursni kiriting (1$ = UZS)
                        </label>
                        <input 
                           type="number" 
                           value={exchangeRate} 
                           onChange={(e) => setExchangeRate(e.target.value)}
                           className="w-full bg-black/30 p-3 rounded-xl text-yellow-500 font-bold text-lg outline-none border border-white/5 focus:border-yellow-500"
                        />
                    </div>
                 )}

                 {/* Kategoriya Grid */}
                 <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-gray-500 text-[10px] font-bold uppercase">Kategoriya</label>
                        <button className="text-[#2ef2ff] text-[10px] font-bold">+ Yangi</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                        {categories.filter(c => c.type === type).map(c => (
                            <button key={c.id} onClick={() => setCatId(c.id)} className={`py-3 px-2 rounded-xl text-xs font-bold truncate transition-all ${catId === c.id ? 'neu-pressed text-[#2ef2ff] border border-[#2ef2ff]/30' : 'neu-panel text-gray-500'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Sana va Izoh */}
                 <div className="grid grid-cols-2 gap-3">
                     <input type="date" value={date} onChange={e => setDate(e.target.value)} className="neu-panel p-3 rounded-xl text-gray-300 outline-none text-xs"/>
                     <button className="neu-panel p-3 rounded-xl text-gray-400 flex items-center justify-center gap-2 text-xs">
                        <MapPin size={16}/> Lokatsiya
                     </button>
                 </div>
                 <input value={note} onChange={e => setNote(e.target.value)} placeholder="Izoh..." className="w-full neu-panel p-4 rounded-xl text-gray-300 outline-none text-sm"/>

                 <button 
                    onClick={() => onSave({ 
                        id: initialData?.id || '', 
                        amount: parseFloat(amount), 
                        type, walletId, categoryId: catId, date, note,
                        exchangeRate: isUSD ? parseFloat(exchangeRate) : undefined 
                    })} 
                    className="w-full py-4 neu-panel bg-[#161a22] rounded-2xl font-bold text-[#2ef2ff] uppercase tracking-widest shadow-[0_0_20px_rgba(46,242,255,0.2)] active:scale-95"
                 >
                    SAQLASH
                 </button>
             </div>
         )}
      </div>
    </div>
  );
}
