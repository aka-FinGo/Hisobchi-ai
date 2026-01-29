import { useState, useEffect } from 'react';
import { X, ArrowLeft, MapPin, Plus, DollarSign, Calendar, FileText } from 'lucide-react';
import { TransactionType, Wallet, Category, Transaction } from '../types';

interface Props {
  isOpen: boolean; onClose: () => void; onSave: (data: Transaction) => void;
  categories: Category[]; wallets: Wallet[]; allTransactions: Transaction[]; initialData?: Transaction | null;
  onAddCategory: (cat: Category) => void; onUpdateCategories: (cats: Category[]) => void; settings: any;
}

type ViewState = 'main' | 'new-cat' | 'new-sub' | 'new-child';

export default function TransactionModal({ isOpen, onClose, onSave, categories, wallets, allTransactions, initialData, onAddCategory, onUpdateCategories, settings }: Props) {
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
  
  // ALOHIDA STATE
  const [note, setNote] = useState('');     // Faqat izoh uchun
  const [location, setLocation] = useState(''); // Faqat lokatsiya uchun

  // Smart History (Avvalgi lokatsiyalar)
  const uniqueLocations = Array.from(new Set(allTransactions.map(t => {
     // Eski datadan faqat lokatsiya qismini ajratib olishga harakat qilamiz
     if(t.note?.includes('📍')) return t.note.split('|')[0].replace('📍', '').trim();
     return '';
  }).filter(l => l.length > 0)));

  useEffect(() => {
    if (initialData) {
      setType(initialData.type); setAmount(initialData.amount.toString()); setWalletId(initialData.walletId);
      setExchangeRate(initialData.exchangeRate?.toString() || '12800'); setCatId(initialData.categoryId);
      setSubId(initialData.subCategoryId || ''); setChildId(initialData.childCategoryId || ''); setDate(initialData.date);
      
      // Note va Locationni ajratish
      const fullNote = initialData.note || '';
      if (fullNote.includes('📍')) {
          const parts = fullNote.split('|');
          setLocation(parts[0].replace('📍', '').trim());
          setNote(parts.slice(1).join('|').trim());
      } else {
          setNote(fullNote);
          setLocation('');
      }
    } else {
      setAmount(''); setWalletId(wallets[0]?.id || ''); setCatId(''); setSubId(''); setChildId(''); 
      setLocation(''); setNote('');
    }
    setView('main');
  }, [initialData, isOpen]);

  const handleSave = () => {
      // Saqlashda ikkalasini birlashtiramiz
      let finalNote = note;
      if (location) {
          finalNote = `📍 ${location} ${note ? '| ' + note : ''}`;
      }
      
      onSave({ 
          id: initialData?.id || '', amount: parseFloat(amount), type, walletId, categoryId: catId, subCategoryId: subId, childCategoryId: childId, date, 
          note: finalNote, 
          exchangeRate: selectedWallet?.currency === 'USD' ? parseFloat(exchangeRate) : undefined 
      });
  };

  const handleAddItem = () => { /* ... Eski kod bilan bir xil ... */ 
    if(!newItemName) return; const ts = Date.now();
    if (view === 'new-cat') { onAddCategory({ id: `c_${ts}`, name: newItemName, icon: 'Circle', type, subs: [] }); setCatId(`c_${ts}`); } 
    else if (view === 'new-sub' && catId) { onUpdateCategories(categories.map(c => c.id === catId ? { ...c, subs: [...(c.subs || []), { id: `s_${ts}`, name: newItemName, items: [] }] } : c)); setSubId(`s_${ts}`); }
    else if (view === 'new-child' && catId && subId) { onUpdateCategories(categories.map(c => c.id === catId ? { ...c, subs: c.subs?.map(s => s.id === subId ? { ...s, items: [...(s.items || []), { id: `i_${ts}`, name: newItemName }] } : s) } : c)); setChildId(`i_${ts}`); }
    setNewItemName(''); setView('main');
  };

  const selectedWallet = wallets.find(w => w.id === walletId);
  const currentCategory = categories.find(c => c.id === catId);
  const currentSub = currentCategory?.subs?.find(s => s.id === subId);
  const themeColor = type === 'income' ? '#00d4ff' : '#ff3366';
  const shadowColor = `${themeColor}66`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#05070a]/95 backdrop-blur-md flex flex-col animate-slideUp">
      <div className="p-5 flex justify-between items-center border-b border-white/5 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ background: themeColor }}></div>
         {view !== 'main' ? (<button onClick={() => setView('main')} className="text-white flex items-center gap-1 text-xs font-bold z-10"><ArrowLeft size={18}/> ORQAGA</button>) : <div className="w-16"></div>}
         <h2 className="text-white font-bold text-sm uppercase tracking-[0.2em] z-10" style={{ textShadow: `0 0 10px ${themeColor}` }}>{view === 'main' ? (initialData ? 'Tahrirlash' : 'Yangi Amal') : 'Yaratish'}</h2>
         <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-gray-400 z-10 hover:bg-white/10"><X size={20}/></button>
      </div>

      {view === 'main' && (
        <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-area">
             {/* Type Switcher */}
             <div className="flex p-1 bg-[#141e3c] rounded-2xl mb-8 relative border border-white/5">
                <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all duration-300 ${type === 'expense' ? 'text-white' : 'text-gray-500'}`} style={type === 'expense' ? { background: themeColor, boxShadow: `0 0 15px ${shadowColor}` } : {}}>Chiqim</button>
                <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all duration-300 ${type === 'income' ? 'bg-[#00d4ff] text-[#0a0e17] shadow-[0_0_15px_#00d4ff]' : 'text-gray-500'}`}>Kirim</button>
             </div>

             {/* Amount */}
             <div className="text-center mb-10 relative">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Summa</p>
                 <div className="relative inline-block">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full bg-transparent text-6xl font-bold text-center text-white focus:outline-none placeholder-gray-800 transition-colors" style={{ caretColor: themeColor, textShadow: `0 0 20px ${shadowColor}` }} autoFocus={!initialData}/>
                 </div>
             </div>

             {/* Wallet */}
             <div className="mb-6">
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-3 pl-1">Hamyon</p>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                    {wallets.map(w => (
                        <button key={w.id} onClick={() => setWalletId(w.id)} className={`shrink-0 px-5 py-4 rounded-2xl min-w-[140px] text-left transition-all border relative overflow-hidden ${walletId === w.id ? 'bg-[#141e3c] border-transparent' : 'bg-[#0b101b] border-white/5'}`} style={{ boxShadow: walletId === w.id ? `0 0 15px ${shadowColor}, inset 0 0 20px rgba(0,0,0,0.5)` : 'none' }}>
                           <p className={`font-bold text-sm mb-1 ${walletId === w.id ? 'text-white' : 'text-gray-400'}`}>{w.name}</p>
                           <p className="text-[10px] font-mono text-gray-500">{w.currency}</p>
                           {walletId === w.id && <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: themeColor }}></div>}
                        </button>
                    ))}
                </div>
             </div>
             
             {/* Kategoriyalar (Qisqartirilgan) */}
             <div className="space-y-4 mb-8">
                 <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-gray-500 text-[10px] font-bold uppercase">Kategoriya</label>
                        <button onClick={() => setView('new-cat')} className="text-[10px] font-bold flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: themeColor }}><Plus size={12}/> YANGI</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.filter(c => c.type === type).map(c => (
                            <button key={c.id} onClick={() => { setCatId(c.id); setSubId(''); setChildId(''); }} className={`py-4 px-2 rounded-xl text-xs font-bold truncate transition-all border ${catId === c.id ? 'bg-[#141e3c] border-transparent text-white' : 'bg-[#0b101b] border-white/5 text-gray-500'}`} style={catId === c.id ? { boxShadow: `inset 0 0 10px ${shadowColor}`, borderColor: themeColor } : {}}>{c.name}</button>
                        ))}
                    </div>
                 </div>
                 {/* ... Sub/Child categories ... */}
                  {catId && (<div className="animate-slideUp"><div className="flex justify-between items-center mb-3"><label className="text-gray-500 text-[10px] font-bold uppercase">Podkategoriya</label><button onClick={() => setView('new-sub')} className="text-[10px] font-bold flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg" style={{ color: themeColor }}><Plus size={12}/> YANGI</button></div><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{currentCategory?.subs?.map(s => (<button key={s.id} onClick={() => { setSubId(s.id); setChildId(''); }} className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${subId === s.id ? 'bg-[#141e3c] text-white' : 'bg-[#0b101b] border-white/5 text-gray-500'}`} style={subId === s.id ? { borderColor: themeColor } : {}}>{s.name}</button>))}</div></div>)}
                  {subId && (<div className="animate-slideUp"><div className="flex justify-between items-center mb-3"><label className="text-gray-500 text-[10px] font-bold uppercase">Quyi (Oy/Zakaz)</label><button onClick={() => setView('new-child')} className="text-[10px] font-bold flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg" style={{ color: themeColor }}><Plus size={12}/> YANGI</button></div><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{currentSub?.items?.map(i => (<button key={i.id} onClick={() => setChildId(i.id)} className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${childId === i.id ? 'bg-[#141e3c] text-white' : 'bg-[#0b101b] border-white/5 text-gray-500'}`} style={childId === i.id ? { borderColor: themeColor } : {}}>{i.name}</button>))}</div></div>)}
             </div>

             {/* SANA, LOKATSIYA VA IZOH (ALOHIDA) */}
             <div className="space-y-4 mb-8">
                 <div className="grid grid-cols-1 gap-3">
                     {/* SANA */}
                     <div className="bg-[#0b101b] border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                        <Calendar size={18} className="text-gray-500"/>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-gray-300 outline-none text-xs w-full font-bold"/>
                     </div>
                     
                     {/* LOKATSIYA (List bilan) */}
                     <div className="bg-[#0b101b] border border-white/5 rounded-2xl p-3 flex items-center gap-3 relative">
                        <MapPin size={18} className="text-gray-500"/>
                        <input list="locations-list" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Lokatsiya (ixtiyoriy)" className="bg-transparent text-gray-300 outline-none text-sm w-full font-bold placeholder-gray-600"/>
                        <datalist id="locations-list">{uniqueLocations.map((loc, idx) => (<option key={idx} value={loc} />))}</datalist>
                     </div>

                     {/* IZOH (TEXTAREA) */}
                     <div className="bg-[#0b101b] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                        <FileText size={18} className="text-gray-500 mt-1"/>
                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Izoh (nima uchun?)..." rows={2} className="w-full bg-transparent text-gray-300 outline-none text-sm placeholder-gray-600 resize-none font-medium"/>
                     </div>
                 </div>
             </div>

             <button disabled={!amount} onClick={handleSave} className="w-full py-4 rounded-2xl font-bold text-[#05070a] uppercase tracking-widest text-sm transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale" style={{ background: themeColor, boxShadow: `0 0 25px ${shadowColor}` }}>{initialData ? 'Saqlash' : "Qo'shish"}</button>
        </div>
      )}
      
      {view !== 'main' && (
           <div className="flex-1 p-6 flex flex-col justify-center animate-slideUp">
               <h3 className="text-white text-lg font-bold mb-8 text-center uppercase tracking-widest" style={{ color: themeColor }}>Kategoriya Yaratish</h3>
               <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Nomini yozing..." className="w-full bg-transparent border-b-2 text-2xl text-center text-white pb-4 focus:outline-none mb-12 placeholder-gray-700" style={{ borderColor: themeColor, caretColor: themeColor }}/>
               <button onClick={handleAddItem} className="w-full py-4 rounded-2xl font-bold uppercase text-[#05070a]" style={{ background: themeColor, boxShadow: `0 0 20px ${shadowColor}` }}>Yaratish</button>
           </div>
      )}
    </div>
  );
}
