import { useState, useEffect } from 'react';
import { X, Check, MapPin, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import { TransactionType, Wallet, Category, Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Transaction) => void;
  categories: Category[];
  wallets: Wallet[];
  initialData?: Transaction | null;
  onAddCategory: (cat: Category) => void; // Yangi kategoriya yaratish uchun
}

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData, onAddCategory }: Props) {
  // States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Summa/Tur, 2: Hamyon, 3: Kategoriya/Detallar
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  
  // Hierarchy States
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [childId, setChildId] = useState(''); // 3-daraja
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setWalletId(initialData.walletId);
      setCatId(initialData.categoryId);
      setSubId(initialData.subCategoryId || '');
      setChildId(initialData.childCategoryId || '');
      setDate(initialData.date);
      setNote(initialData.note || '');
      setLocation(initialData.location || '');
      setStep(3); // Tahrirlashda oxirgi oynadan boshlaymiz
    } else {
      setStep(1);
      setAmount('');
      setCatId('');
      setSubId('');
      setChildId('');
    }
  }, [initialData, isOpen]);

  // Lokatsiyani aniqlash (Browser API)
  const detectLocation = () => {
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
       }, () => alert("Lokatsiya aniqlanmadi"));
    }
  };

  if (!isOpen) return null;

  const currentWallet = wallets.find(w => w.id === walletId);
  const currentCategory = categories.find(c => c.id === catId);
  const currentSub = currentCategory?.subs?.find(s => s.id === subId);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-slideUp">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
         {step > 1 ? (
             <button onClick={() => setStep(step - 1 as any)} className="text-gray-400"><ArrowLeft/></button>
         ) : <div className="w-6"></div>}
         
         <h2 className="text-white font-bold text-lg uppercase tracking-widest">
            {step === 1 ? 'Summa' : step === 2 ? 'Hamyon' : 'Tafsilotlar'}
         </h2>
         
         <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400"><X size={20}/></button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
         
         {/* STEP 1: SUMMA va TUR */}
         {step === 1 && (
             <>
               <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/5">
                 <button onClick={() => setType('expense')} className={`flex-1 py-4 rounded-xl font-bold transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-500'}`}>Chiqim</button>
                 <button onClick={() => setType('income')} className={`flex-1 py-4 rounded-xl font-bold transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500'}`}>Kirim</button>
               </div>

               <div className="text-center mt-10">
                 <input 
                   type="number" 
                   value={amount} 
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0"
                   className="w-full bg-transparent text-6xl font-black text-center text-white focus:outline-none placeholder-white/10 caret-orange-500"
                   autoFocus
                 />
                 <p className="text-orange-500 font-bold mt-2 uppercase">UZS / USD</p>
               </div>

               <button disabled={!amount} onClick={() => setStep(2)} className="w-full mt-auto py-4 bg-orange-500 text-white font-black rounded-2xl disabled:opacity-50">
                  DAVOM ETISH
               </button>
             </>
         )}

         {/* STEP 2: HAMYON TANLASH */}
         {step === 2 && (
             <div className="space-y-4">
                 {/* Hamyonlarni guruhlash */}
                 {['UZS', 'USD'].map(curr => (
                     <div key={curr}>
                         <p className="text-gray-500 text-xs font-bold uppercase mb-2">{curr} Hamyonlar</p>
                         <div className="grid grid-cols-2 gap-3">
                             {wallets.filter(w => w.currency === curr).map(w => (
                                 <button 
                                    key={w.id} 
                                    onClick={() => { setWalletId(w.id); setStep(3); }}
                                    className={`p-4 rounded-2xl border text-left transition-all ${walletId === w.id ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-transparent'}`}
                                 >
                                    <p className="text-white font-bold">{w.name}</p>
                                    <p className="text-gray-500 text-xs">{w.balance.toLocaleString()} {w.currency}</p>
                                 </button>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
         )}

         {/* STEP 3: KATEGORIYA IERARXIYASI va SAVE */}
         {step === 3 && (
             <div className="space-y-6">
                 
                 {/* Info Card */}
                 <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <p className="text-2xl font-black text-white">{parseFloat(amount).toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">{currentWallet?.name}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${type === 'income' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                        {type === 'income' ? 'KIRIM' : 'CHIQIM'}
                    </div>
                 </div>

                 {/* 1. LEVEL: Category */}
                 <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-gray-500 text-[10px] font-bold uppercase">Kategoriya</label>
                        <button className="text-orange-500 text-[10px] font-bold">+ Yangi</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.filter(c => c.type === type).map(c => (
                            <button key={c.id} onClick={() => { setCatId(c.id); setSubId(''); setChildId(''); }} className={`px-4 py-2 rounded-xl whitespace-nowrap border ${catId === c.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white/5 border-transparent text-gray-400'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* 2. LEVEL: SubCategory */}
                 {catId && currentCategory?.subs && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between mb-2">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Podkategoriya</label>
                             <button className="text-orange-500 text-[10px] font-bold">+ Yangi</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentCategory.subs.map(s => (
                                <button key={s.id} onClick={() => { setSubId(s.id); setChildId(''); }} className={`px-4 py-2 rounded-xl whitespace-nowrap border ${subId === s.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-transparent text-gray-400'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}

                 {/* 3. LEVEL: Deep Child */}
                 {subId && currentSub?.items && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between mb-2">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Quyi Kategoriya (Oy/Zakaz)</label>
                             <button className="text-orange-500 text-[10px] font-bold">+ Yangi</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentSub.items.map(i => (
                                <button key={i.id} onClick={() => setChildId(i.id)} className={`px-4 py-2 rounded-xl whitespace-nowrap border ${childId === i.id ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white/5 border-transparent text-gray-400'}`}>
                                    {i.name}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}

                 {/* Date & Note & Location */}
                 <div className="grid grid-cols-2 gap-3">
                     <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 p-3 rounded-xl text-white outline-none"/>
                     <button onClick={detectLocation} className="bg-white/5 p-3 rounded-xl text-gray-400 flex items-center justify-center gap-2 text-xs">
                        <MapPin size={16}/> {location ? 'Aniqlandi' : 'Lokatsiya'}
                     </button>
                 </div>
                 <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    placeholder="Izoh yozing..." 
                    className="w-full bg-white/5 p-3 rounded-xl text-white outline-none h-20"
                 />

                 <button 
                    onClick={() => onSave({ 
                        id: initialData?.id || '', // ID saqlanadi
                        amount: parseFloat(amount), 
                        type, 
                        walletId, 
                        categoryId: catId, 
                        subCategoryId: subId, 
                        childCategoryId: childId, 
                        date, 
                        note, 
                        location 
                    })} 
                    className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                 >
                    SAQLASH
                 </button>
             </div>
         )}

      </div>
    </div>
  );
}
