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
  onUpdateCategories: (cats: Category[]) => void;
}

// Sahifalar: main, new-cat (kategoriya), new-sub (pod), new-child (quyi)
type ViewState = 'main' | 'new-cat' | 'new-sub' | 'new-child';

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData, onAddCategory, onUpdateCategories }: Props) {
  const [view, setView] = useState<ViewState>('main');
  const [newItemName, setNewItemName] = useState('');

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [exchangeRate, setExchangeRate] = useState('12800');
  
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [childId, setChildId] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setWalletId(initialData.walletId);
      setExchangeRate(initialData.exchangeRate?.toString() || '12800');
      setCatId(initialData.categoryId);
      setSubId(initialData.subCategoryId || '');
      setChildId(initialData.childCategoryId || '');
      setDate(initialData.date);
      setNote(initialData.note || '');
    } else {
      setAmount('');
      setWalletId(wallets[0]?.id || '');
      setCatId(''); setSubId(''); setChildId('');
    }
    setView('main');
  }, [initialData, isOpen]);

  const handleAddItem = () => {
    if(!newItemName) return;
    const ts = Date.now();

    if (view === 'new-cat') {
        const newCat: Category = { id: `c_${ts}`, name: newItemName, icon: 'Circle', type, subs: [] };
        onAddCategory(newCat);
        setCatId(newCat.id);
    } 
    else if (view === 'new-sub' && catId) {
        const updated = categories.map(c => c.id === catId ? { ...c, subs: [...(c.subs || []), { id: `s_${ts}`, name: newItemName, items: [] }] } : c);
        onUpdateCategories(updated);
        setSubId(`s_${ts}`);
    }
    else if (view === 'new-child' && catId && subId) {
        const updated = categories.map(c => c.id === catId ? {
            ...c, subs: c.subs.map(s => s.id === subId ? { ...s, items: [...(s.items || []), { id: `i_${ts}`, name: newItemName }] } : s)
        } : c);
        onUpdateCategories(updated);
        setChildId(`i_${ts}`);
    }
    setNewItemName('');
    setView('main');
  };

  const selectedWallet = wallets.find(w => w.id === walletId);
  const currentCategory = categories.find(c => c.id === catId);
  const currentSub = currentCategory?.subs?.find(s => s.id === subId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0f14]/95 backdrop-blur-xl flex flex-col animate-slideUp">
      
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/5">
         {view !== 'main' ? (
             <button onClick={() => setView('main')} className="text-[#00ffff] flex items-center gap-1 text-xs font-bold"><ArrowLeft size={16}/> ORQAGA</button>
         ) : <div className="w-16"></div>}
         
         <h2 className="text-white font-bold text-sm uppercase tracking-widest text-shadow-neon">
            {view === 'main' ? (initialData ? 'Tahrirlash' : 'Yangi Amal') : 'Yaratish'}
         </h2>
         <button onClick={onClose} className="p-2 switch-base rounded-full text-gray-400"><X size={20}/></button>
      </div>

      {/* MAIN FORM */}
      {view === 'main' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
             
             {/* 1. Summa */}
             <div className="text-center">
                 <input 
                   type="number" 
                   value={amount} 
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0"
                   className="w-full bg-transparent text-5xl font-bold text-center text-white focus:outline-none caret-[#00ffff] drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]"
                   autoFocus={!initialData}
                 />
                 <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => setType('expense')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${type === 'expense' ? 'switch-track text-rose-400 border border-rose-500/30' : 'text-gray-600'}`}>CHIQIM</button>
                    <button onClick={() => setType('income')} className={`px-6 py-2 rounded-xl font-bold transition-all ${type === 'income' ? 'switch-track text-[#00ffff] border border-[#00ffff]/30' : 'text-gray-600'}`}>KIRIM</button>
                 </div>
             </div>

             {/* 2. Hamyon */}
             <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-2">Hamyon</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {wallets.map(w => (
                        <button 
                           key={w.id} onClick={() => setWalletId(w.id)}
                           className={`shrink-0 px-4 py-3 rounded-xl min-w-[120px] text-left transition-all ${walletId === w.id ? 'switch-track border border-[#00ffff]/30' : 'switch-base'}`}
                        >
                           <p className={`font-bold text-sm ${walletId === w.id ? 'text-[#00ffff]' : 'text-gray-400'}`}>{w.name}</p>
                           <p className="text-[10px] text-gray-600">{w.currency}</p>
                        </button>
                    ))}
                </div>
             </div>

             {/* Kurs (Agar USD bo'lsa) */}
             {selectedWallet?.currency === 'USD' && (
                <div className="switch-base p-3 rounded-xl border border-yellow-500/20">
                    <label className="text-yellow-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><DollarSign size={12}/> Kurs</label>
                    <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="w-full bg-transparent text-yellow-500 font-bold outline-none"/>
                </div>
             )}

             {/* 3. Kategoriyalar (TUGMALAR QAYTARILDI!) */}
             <div className="space-y-4">
                 
                 {/* Kategoriya */}
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-gray-500 text-[10px] font-bold uppercase">Kategoriya</label>
                        <button onClick={() => setView('new-cat')} className="text-[#00ffff] text-[10px] font-bold flex items-center gap-1 bg-[#00ffff]/10 px-2 py-1 rounded-lg hover:bg-[#00ffff]/20 transition-colors">
                            <Plus size={12}/> YANGI
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.filter(c => c.type === type).map(c => (
                            <button key={c.id} onClick={() => { setCatId(c.id); setSubId(''); setChildId(''); }} className={`py-3 px-2 rounded-xl text-xs font-bold truncate transition-all ${catId === c.id ? 'switch-track text-[#00ffff] border border-[#00ffff]/30' : 'switch-base text-gray-500'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Podkategoriya */}
                 {catId && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Podkategoriya</label>
                             <button onClick={() => setView('new-sub')} className="text-[#00ffff] text-[10px] font-bold flex items-center gap-1 bg-[#00ffff]/10 px-2 py-1 rounded-lg hover:bg-[#00ffff]/20 transition-colors">
                                <Plus size={12}/> YANGI
                             </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentCategory?.subs?.map(s => (
                                <button key={s.id} onClick={() => { setSubId(s.id); setChildId(''); }} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${subId === s.id ? 'switch-track text-[#00ffff]' : 'switch-base text-gray-500'}`}>{s.name}</button>
                            ))}
                        </div>
                     </div>
                 )}

                 {/* Quyi Kategoriya */}
                 {subId && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Quyi (Oy/Zakaz)</label>
                             <button onClick={() => setView('new-child')} className="text-[#00ffff] text-[10px] font-bold flex items-center gap-1 bg-[#00ffff]/10 px-2 py-1 rounded-lg hover:bg-[#00ffff]/20 transition-colors">
                                <Plus size={12}/> YANGI
                             </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentSub?.items?.map(i => (
                                <button key={i.id} onClick={() => setChildId(i.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${childId === i.id ? 'switch-track text-[#00ffff]' : 'switch-base text-gray-500'}`}>{i.name}</button>
                            ))}
                        </div>
                     </div>
                 )}
             </div>

             <div className="grid grid-cols-2 gap-3">
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="switch-base p-3 rounded-xl text-gray-300 outline-none text-xs text-center"/>
                 <button className="switch-base p-3 rounded-xl text-gray-400 flex items-center justify-center gap-2 text-xs"><MapPin size={16}/> Lokatsiya</button>
             </div>
             <input value={note} onChange={e => setNote(e.target.value)} placeholder="Izoh..." className="w-full switch-base p-4 rounded-xl text-gray-300 outline-none text-sm"/>

             <button 
                disabled={!amount}
                onClick={() => onSave({ 
                    id: initialData?.id || '', 
                    amount: parseFloat(amount), 
                    type, walletId, categoryId: catId, subCategoryId: subId, childCategoryId: childId, date, note,
                    exchangeRate: selectedWallet?.currency === 'USD' ? parseFloat(exchangeRate) : undefined 
                })} 
                className="w-full py-4 switch-track rounded-2xl font-bold text-[#00ffff] uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,255,0.2)] active:scale-95 disabled:opacity-50"
             >
                {initialData ? 'Saqlash' : 'Qo\'shish'}
             </button>
        </div>
      )}

      {/* CREATE NEW ITEM VIEW */}
      {view !== 'main' && (
          <div className="flex-1 p-6 flex flex-col justify-center animate-slideUp">
              <h3 className="text-white text-lg font-bold mb-8 text-center uppercase tracking-widest text-[#00ffff]">
                  {view === 'new-cat' ? 'Kategoriya Yaratish' : view === 'new-sub' ? 'Podkategoriya Yaratish' : 'Quyi Kategoriya Yaratish'}
              </h3>
              <input 
                 autoFocus
                 value={newItemName}
                 onChange={e => setNewItemName(e.target.value)}
                 placeholder="Nomini kiriting..."
                 className="w-full bg-transparent border-b border-[#00ffff] text-2xl text-center text-white pb-2 focus:outline-none mb-10 caret-[#00ffff]"
              />
              <button onClick={handleAddItem} className="w-full py-4 switch-track rounded-2xl text-[#00ffff] font-bold uppercase shadow-[0_0_10px_rgba(0,255,255,0.2)]">SAQLASH</button>
          </div>
      )}

    </div>
  );
}
