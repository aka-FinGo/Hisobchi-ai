import { useState, useEffect } from 'react';
import { X, ArrowLeft, MapPin, Plus, DollarSign, Calendar, FileText, Loader2 } from 'lucide-react';
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

type ViewState = 'main' | 'new-cat' | 'new-sub' | 'new-child';

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, initialData, onAddCategory, onUpdateCategories }: Props) {
  // --- STATE ---
  const [view, setView] = useState<ViewState>('main');
  const [newItemName, setNewItemName] = useState('');

  // Form Data
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [exchangeRate, setExchangeRate] = useState('12800');
  
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [childId, setChildId] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  // Location
  const [location, setLocation] = useState('');
  const [isLocLoading, setIsLocLoading] = useState(false);

  // --- INITIALIZATION ---
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
      setLocation(''); // Lokatsiya odatda saqlanmaydi, lekin kerak bo'lsa qo'shish mumkin
    } else {
      setAmount('');
      setWalletId(wallets[0]?.id || '');
      setCatId(''); setSubId(''); setChildId('');
      setLocation('');
      // Default type expense qoladi
    }
    setView('main');
  }, [initialData, isOpen]);

  // --- HANDLERS ---
  
  // Lokatsiya olish (Geolocation API)
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzeringiz lokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    setIsLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Muvaffaqiyatli
        const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        setLocation(coords);
        setIsLocLoading(false);
      },
      (error) => {
        alert("Lokatsiyani aniqlab bo'lmadi. GPS yoqilganini tekshiring.");
        setIsLocLoading(false);
      }
    );
  };

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

  // --- STYLING CONSTANTS ---
  // Ranglarni dinamik tanlash
  const themeColor = type === 'income' ? '#00d4ff' : '#ff3366'; // Blue vs Pink
  const shadowColor = type === 'income' ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 51, 102, 0.4)';
  const bgGradient = type === 'income' 
    ? 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,0,0,0))' 
    : 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(0,0,0,0))';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#05070a]/95 backdrop-blur-md flex flex-col animate-slideUp">
      
      {/* HEADER */}
      <div className="p-5 flex justify-between items-center border-b border-white/5 relative overflow-hidden">
         {/* Orqa fon nuri */}
         <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: bgGradient }}></div>

         {view !== 'main' ? (
             <button onClick={() => setView('main')} className="text-white flex items-center gap-1 text-xs font-bold z-10"><ArrowLeft size={18}/> ORQAGA</button>
         ) : <div className="w-16"></div>}
         
         <h2 className="text-white font-bold text-sm uppercase tracking-[0.2em] z-10" style={{ textShadow: `0 0 10px ${themeColor}` }}>
            {view === 'main' ? (initialData ? 'Tahrirlash' : 'Yangi Amal') : 'Yaratish'}
         </h2>
         <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-gray-400 z-10 hover:bg-white/10"><X size={20}/></button>
      </div>

      {/* MAIN FORM */}
      {view === 'main' && (
        <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-area">
             
             {/* 1. TYPE SWITCHER (Kirim / Chiqim) */}
             <div className="flex p-1 bg-[#141e3c] rounded-2xl mb-8 relative border border-white/5">
                <button 
                    onClick={() => setType('expense')} 
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all duration-300 ${type === 'expense' ? 'bg-[#ff3366] text-white shadow-[0_0_15px_#ff3366]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Chiqim
                </button>
                <button 
                    onClick={() => setType('income')} 
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all duration-300 ${type === 'income' ? 'bg-[#00d4ff] text-[#05070a] shadow-[0_0_15px_#00d4ff]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Kirim
                </button>
             </div>

             {/* 2. KATTA SUMMA */}
             <div className="text-center mb-10 relative">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Summa</p>
                 <div className="relative inline-block">
                    <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-6xl font-bold text-center text-white focus:outline-none placeholder-gray-800 transition-colors"
                    style={{ caretColor: themeColor, textShadow: `0 0 20px ${shadowColor}` }}
                    autoFocus={!initialData}
                    />
                 </div>
             </div>

             {/* 3. HAMYON */}
             <div className="mb-6">
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-3 pl-1">Hamyon</p>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                    {wallets.map(w => (
                        <button 
                           key={w.id} onClick={() => setWalletId(w.id)}
                           className={`shrink-0 px-5 py-4 rounded-2xl min-w-[140px] text-left transition-all border relative overflow-hidden ${walletId === w.id ? 'bg-[#141e3c] border-transparent' : 'bg-[#0b101b] border-white/5'}`}
                           style={{ boxShadow: walletId === w.id ? `0 0 15px ${shadowColor}, inset 0 0 20px rgba(0,0,0,0.5)` : 'none' }}
                        >
                           <p className={`font-bold text-sm mb-1 ${walletId === w.id ? 'text-white' : 'text-gray-400'}`}>{w.name}</p>
                           <p className="text-[10px] font-mono text-gray-500">{w.currency}</p>
                           {/* Active Indicator Line */}
                           {walletId === w.id && <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: themeColor }}></div>}
                        </button>
                    ))}
                </div>
             </div>

             {/* Kurs (USD bo'lsa) */}
             {selectedWallet?.currency === 'USD' && (
                <div className="mb-6 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
                    <label className="text-yellow-500 text-xs font-bold uppercase flex items-center gap-2"><DollarSign size={14}/> Kurs (1$ = UZS)</label>
                    <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="bg-transparent text-right text-yellow-500 font-bold outline-none text-lg w-32"/>
                </div>
             )}

             {/* 4. KATEGORIYALAR */}
             <div className="space-y-4 mb-8">
                 {/* Asosiy Kategoriya */}
                 <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-gray-500 text-[10px] font-bold uppercase">Kategoriya</label>
                        <button onClick={() => setView('new-cat')} className="text-[10px] font-bold flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: themeColor }}>
                            <Plus size={12}/> YANGI
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.filter(c => c.type === type).map(c => (
                            <button key={c.id} onClick={() => { setCatId(c.id); setSubId(''); setChildId(''); }} 
                                className={`py-4 px-2 rounded-xl text-xs font-bold truncate transition-all border ${catId === c.id ? 'bg-[#141e3c] border-transparent text-white' : 'bg-[#0b101b] border-white/5 text-gray-500'}`}
                                style={catId === c.id ? { boxShadow: `inset 0 0 10px ${shadowColor}`, borderColor: themeColor } : {}}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Podkategoriya */}
                 {catId && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-3">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Podkategoriya</label>
                             <button onClick={() => setView('new-sub')} className="text-[10px] font-bold flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg" style={{ color: themeColor }}>
                                <Plus size={12}/> YANGI
                             </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentCategory?.subs?.map(s => (
                                <button key={s.id} onClick={() => { setSubId(s.id); setChildId(''); }} className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${subId === s.id ? 'bg-[#141e3c] text-white' : 'bg-[#0b101b] border-white/5 text-gray-500'}`}
                                style={subId === s.id ? { borderColor: themeColor } : {}}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}

                 {/* Quyi Kategoriya */}
                 {subId && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-3">
                             <label className="text-gray-500 text-[10px] font-bold uppercase">Quyi (Oy/Zakaz)</label>
                             <button onClick={() => setView('new-child')} className="text-[10px] font-bold flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg" style={{ color: themeColor }}>
                                <Plus size={12}/> YANGI
                             </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentSub?.items?.map(i => (
                                <button key={i.id} onClick={() => setChildId(i.id)} className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${childId === i.id ? 'bg-[#141e3c] text-white' : 'bg-[#0b101b] border-white/5 text-gray-500'}`}
                                style={childId === i.id ? { borderColor: themeColor } : {}}>
                                    {i.name}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}
             </div>

             {/* 5. EXTRAS (Date, Location, Note) */}
             <div className="space-y-4 mb-8">
                 <div className="grid grid-cols-2 gap-3">
                     {/* SANA */}
                     <div className="bg-[#0b101b] border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                        <Calendar size={18} className="text-gray-500"/>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-gray-300 outline-none text-xs w-full font-bold"/>
                     </div>

                     {/* LOKATSIYA (Ishlaydigan) */}
                     <button 
                        onClick={handleGetLocation}
                        disabled={isLocLoading}
                        className={`border rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-bold transition-all relative overflow-hidden ${location ? 'bg-[#141e3c] border-transparent text-white' : 'bg-[#0b101b] border-white/5 text-gray-400'}`}
                        style={location ? { borderColor: themeColor, boxShadow: `0 0 10px ${shadowColor}` } : {}}
                     >
                        {isLocLoading ? <Loader2 size={16} className="animate-spin"/> : <MapPin size={16} style={{ color: location ? themeColor : 'inherit' }}/>}
                        <span className="truncate">{location ? location : "Lokatsiya"}</span>
                     </button>
                 </div>

                 {/* IZOH */}
                 <div className="bg-[#0b101b] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                    <FileText size={18} className="text-gray-500 mt-1"/>
                    <textarea 
                        value={note} onChange={e => setNote(e.target.value)} 
                        placeholder="Izoh yozish..." 
                        rows={2}
                        className="w-full bg-transparent text-gray-300 outline-none text-sm placeholder-gray-600 resize-none font-medium"
                    />
                 </div>
             </div>

             {/* SAVE BUTTON (Dynamic Color) */}
             <button 
                disabled={!amount}
                onClick={() => onSave({ 
                    id: initialData?.id || '', 
                    amount: parseFloat(amount), 
                    type, walletId, categoryId: catId, subCategoryId: subId, childCategoryId: childId, date, note,
                    exchangeRate: selectedWallet?.currency === 'USD' ? parseFloat(exchangeRate) : undefined 
                })} 
                className="w-full py-4 rounded-2xl font-bold text-[#05070a] uppercase tracking-widest text-sm transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                style={{ 
                    background: themeColor,
                    boxShadow: `0 0 25px ${shadowColor}` 
                }}
             >
                {initialData ? 'Saqlash' : "Qo'shish"}
             </button>
        </div>
      )}

      {/* CREATE NEW ITEM VIEW (Neon Style) */}
      {view !== 'main' && (
          <div className="flex-1 p-6 flex flex-col justify-center animate-slideUp">
              <h3 className="text-white text-lg font-bold mb-8 text-center uppercase tracking-widest" style={{ color: themeColor, textShadow: `0 0 10px ${shadowColor}` }}>
                  {view === 'new-cat' ? 'Kategoriya Yaratish' : view === 'new-sub' ? 'Podkategoriya Yaratish' : 'Quyi Kategoriya Yaratish'}
              </h3>
              <input 
                 autoFocus
                 value={newItemName}
                 onChange={e => setNewItemName(e.target.value)}
                 placeholder="Nomini yozing..."
                 className="w-full bg-transparent border-b-2 text-2xl text-center text-white pb-4 focus:outline-none mb-12 placeholder-gray-700"
                 style={{ borderColor: themeColor, caretColor: themeColor }}
              />
              <button 
                onClick={handleAddItem} 
                className="w-full py-4 rounded-2xl font-bold uppercase text-[#05070a]"
                style={{ background: themeColor, boxShadow: `0 0 20px ${shadowColor}` }}
              >
                  Yaratish
              </button>
          </div>
      )}
    </div>
  );
}
