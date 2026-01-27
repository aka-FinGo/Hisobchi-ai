import { useState, useEffect } from 'react';
import { X, ArrowLeft, Calendar, MapPin, ChevronRight, Plus } from 'lucide-react';
import { TransactionType, Wallet, Category, Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Transaction) => void;
  categories: Category[];
  wallets: Wallet[];
  initialData?: Transaction | null;
  onAddCategory: (cat: Category) => void; // App.tsx dan keladi
  onUpdateCategories: (cats: Category[]) => void;
}

// Modal ichidagi sahifalar
type ViewState = 'main' | 'new-cat' | 'new-sub' | 'new-child';

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData, onAddCategory, onUpdateCategories }: Props) {
  // Asosiy ma'lumotlar
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [childId, setChildId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Navigatsiya State
  const [view, setView] = useState<ViewState>('main');
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    if (initialData) {
      // Edit Mode
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setWalletId(initialData.walletId);
      setCatId(initialData.categoryId);
      setSubId(initialData.subCategoryId || '');
      setChildId(initialData.childCategoryId || '');
      setDate(initialData.date);
      setNote(initialData.note || '');
    } else {
      // New Mode
      setAmount('');
      setCatId('');
      setSubId('');
      setChildId('');
      setWalletId(wallets[0]?.id || '');
    }
    setView('main'); // Har doim asosiy oynadan boshlash
  }, [initialData, isOpen]);

  // --- YANGI NARSA QO'SHISH LOGIKASI ---
  const handleAddItem = () => {
    if(!newItemName) return;

    if (view === 'new-cat') {
        // Yangi Kategoriya
        const newCat: Category = {
            id: `c_${Date.now()}`,
            name: newItemName,
            icon: 'Circle',
            type: type,
            subs: []
        };
        onAddCategory(newCat);
        setCatId(newCat.id); // Avtomat tanlash
    } 
    else if (view === 'new-sub' && catId) {
        // Yangi Podkategoriya
        const updatedCats = categories.map(c => {
            if(c.id === catId) {
                return { 
                    ...c, 
                    subs: [...(c.subs || []), { id: `s_${Date.now()}`, name: newItemName, items: [] }] 
                };
            }
            return c;
        });
        onUpdateCategories(updatedCats);
    }
    else if (view === 'new-child' && catId && subId) {
        // Yangi Quyi Kategoriya
        const updatedCats = categories.map(c => {
            if(c.id === catId) {
                return {
                    ...c,
                    subs: c.subs.map(s => {
                        if(s.id === subId) {
                            return { ...s, items: [...(s.items || []), { id: `i_${Date.now()}`, name: newItemName }] };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        onUpdateCategories(updatedCats);
    }

    setNewItemName('');
    setView('main'); // Ortga qaytish
  };

  if (!isOpen) return null;
  const currentCategory = categories.find(c => c.id === catId);
  const currentSub = currentCategory?.subs?.find(s => s.id === subId);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0f14]/95 backdrop-blur-xl flex flex-col animate-slideUp">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
         {view !== 'main' ? (
             <button onClick={() => setView('main')} className="text-[#2ef2ff] flex items-center gap-1 font-bold text-sm"><ArrowLeft size={18}/> Orqaga</button>
         ) : <div className="w-16"></div>}
         
         <h2 className="text-white font-bold text-sm uppercase tracking-widest text-neon">
            {view === 'main' ? (initialData ? 'Tahrirlash' : 'Yangi Amal') : 'Yaratish'}
         </h2>
         
         <button onClick={onClose} className="p-2 neu-panel rounded-full text-gray-400"><X size={20}/></button>
      </div>

      {/* --- ASOSIY OYNA (MAIN) --- */}
      {view === 'main' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
             
             {/* 1. Summa */}
             <div className="text-center">
                 <input 
                   type="number" 
                   value={amount} 
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0"
                   className="w-full bg-transparent text-5xl font-bold text-center text-white focus:outline-none placeholder-gray-800 caret-[#2ef2ff] text-neon"
                   autoFocus={!initialData}
                 />
                 <div className="flex justify-center gap-4 mt-4">
                    <button onClick={() => setType('expense')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${type === 'expense' ? 'neu-pressed text-rose-400 border border-rose-500/30' : 'text-gray-600'}`}>CHIQIM</button>
                    <button onClick={() => setType('income')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${type === 'income' ? 'neu-pressed text-[#2ef2ff] border border-cyan-500/30' : 'text-gray-600'}`}>KIRIM</button>
                 </div>
             </div>

             {/* 2. Hamyon (Tahrirlashda ham o'zgartirish mumkin) */}
             <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-2">Hamyon</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {wallets.map(w => (
                        <button 
                           key={w.id} 
                           onClick={() => setWalletId(w.id)}
                           className={`shrink-0 px-4 py-3 rounded-xl min-w-[100px] text-left transition-all ${walletId === w.id ? 'neu-pressed border-neon-thin' : 'neu-panel'}`}
                        >
                           <p className={`font-bold text-sm ${walletId === w.id ? 'text-[#2ef2ff]' : 'text-gray-400'}`}>{w.name}</p>
                           <p className="text-[10px] text-gray-600">{w.currency}</p>
                        </button>
                    ))}
                </div>
             </div>

             {/* 3. Kategoriyalar */}
             <div className="space-y-4">
                 {/* Asosiy Kategoriya */}
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-gray-500 text-[10px] font-bold uppercase">Kategoriya</label>
                        <button onClick={() => setView('new-cat')} className="text-[#2ef2ff] text-[10px] font-bold flex items-center gap-1"><Plus size={12}/> Yangi</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.filter(c => c.type === type).map(c => (
                            <button key={c.id} onClick={() => { setCatId(c.id); setSubId(''); setChildId(''); }} className={`py-3 px-2 rounded-xl text-xs font-bold truncate transition-all ${catId === c.id ? 'neu-pressed text-[#2ef2ff] border-neon-thin' : 'neu-panel text-gray-500'}`}>
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
                             <button onClick={() => setView('new-sub')} className="text-[#2ef2ff] text-[10px] font-bold flex items-center gap-1"><Plus size={12}/> Yangi</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentCategory?.subs?.map(s => (
                                <button key={s.id} onClick={() => { setSubId(s.id); setChildId(''); }} className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold ${subId === s.id ? 'neu-pressed text-[#2ef2ff]' : 'neu-panel text-gray-500'}`}>
                                    {s.name}
                                </button>
                            ))}
                            {(!currentCategory?.subs || currentCategory.subs.length === 0) && <span className="text-xs text-gray-600 italic px-2">Hozircha yo'q</span>}
                        </div>
                     </div>
                 )}

                 {/* Quyi Kategoriya */}
                 {subId && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Quyi (Oy/Zakaz)</label>
                             <button onClick={() => setView('new-child')} className="text-[#2ef2ff] text-[10px] font-bold flex items-center gap-1"><Plus size={12}/> Yangi</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentSub?.items?.map(i => (
                                <button key={i.id} onClick={() => setChildId(i.id)} className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold ${childId === i.id ? 'neu-pressed text-[#2ef2ff]' : 'neu-panel text-gray-500'}`}>
                                    {i.name}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}
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
                    type, walletId, categoryId: catId, subCategoryId: subId, childCategoryId: childId, date, note 
                })} 
                className="w-full py-4 bg-[#161a22] rounded-2xl font-bold text-[#2ef2ff] uppercase tracking-widest shadow-[0_0_20px_rgba(46,242,255,0.2)] border border-[#2ef2ff]/30 active:scale-95 transition-transform"
             >
                {initialData ? 'Saqlash' : 'Qo\'shish'}
             </button>
        </div>
      )}

      {/* --- YANGI KATEGORIYA YARATISH SAHIFASI --- */}
      {view !== 'main' && (
          <div className="flex-1 p-6 flex flex-col justify-center animate-slideUp">
              <h3 className="text-white text-lg font-bold mb-6 text-center">
                  {view === 'new-cat' ? 'Yangi Kategoriya' : view === 'new-sub' ? `"${currentCategory?.name}" ga qo'shish` : `"${currentSub?.name}" ga qo'shish`}
              </h3>
              <input 
                 autoFocus
                 value={newItemName}
                 onChange={e => setNewItemName(e.target.value)}
                 placeholder="Nomini yozing..."
                 className="w-full bg-transparent border-b-2 border-[#2ef2ff] text-2xl text-center text-white pb-2 focus:outline-none mb-10"
              />
              <button onClick={handleAddItem} className="w-full py-4 neu-panel rounded-2xl text-[#2ef2ff] font-bold uppercase">Yaratish</button>
          </div>
      )}

    </div>
  );
}
