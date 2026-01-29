/**
 * START: TRANSACTIONMODAL.TSX (1-BO'LIM)
 * 3 bosqichli kategoriya tizimi va ma'lumotlar state'i.
 */

import { useState, useEffect } from 'react';
import { X, ArrowLeft, Plus, Save, DollarSign, Calendar, Tag, CreditCard } from 'lucide-react';
import { TransactionType, Wallet, Category, Transaction } from '../types';

interface Props {
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: Transaction) => void;
  categories: Category[]; 
  wallets: Wallet[]; 
  allTransactions: Transaction[]; 
  initialData?: Transaction | null;
  onUpdateCategories: (cats: Category[]) => void; 
  settings: any;
}

// Ko'rinish holatlari: Asosiy yoki Yangi qo'shish formalari
type ViewState = 'main' | 'new-cat' | 'new-sub' | 'new-child';

export default function TransactionModal({ 
  isOpen, onClose, onSave, categories, wallets, initialData, onUpdateCategories 
}: Props) {
  // FORM STATE'LARI
  const [view, setView] = useState<ViewState>('main');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [catId, setCatId] = useState('');
  const [subId, setSubId] = useState('');
  const [childId, setChildId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [newItemName, setNewItemName] = useState('');

  // START: EDIT MODE (Agar tahrirlash bo'lsa ma'lumotlarni to'ldirish)
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
    }
  }, [initialData, isOpen]);
  // END: EDIT MODE

  // START: YANGI KATEGORIYA/SUB/CHILD QO'SHISH FUNKSIYASI
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const updatedCats = [...categories];

    if (view === 'new-cat') {
      const newCat: Category = { id: `c_${Date.now()}`, name: newItemName, icon: 'Tag', type, subs: [] };
      onUpdateCategories([...updatedCats, newCat]);
      setCatId(newCat.id);
    } 
    else if (view === 'new-sub' && catId) {
      const cat = updatedCats.find(c => c.id === catId);
      if (cat) {
        cat.subs = [...(cat.subs || []), { id: `s_${Date.now()}`, name: newItemName, items: [] }];
        onUpdateCategories(updatedCats);
      }
    } 
    else if (view === 'new-child' && catId && subId) {
      const cat = updatedCats.find(c => c.id === catId);
      const sub = cat?.subs?.find(s => s.id === subId);
      if (sub) {
        sub.items = [...(sub.items || []), { id: `ch_${Date.now()}`, name: newItemName }];
        onUpdateCategories(updatedCats);
      }
    }

    setNewItemName('');
    setView('main');
  };
  // END: QO'SHISH MANTIQI

  // START: ASOSIY SAQLASH (BASE SAVE)
  const handleFinalSave = () => {
    if (!amount || !walletId || !catId) return;
    onSave({
      id: initialData?.id || Date.now().toString(),
      amount: parseFloat(amount),
      type,
      walletId,
      categoryId: catId,
      subCategoryId: subId || undefined,
      childCategoryId: childId || undefined,
      date,
      note
    });
    onClose();
  };
  // END: ASOSIY SAQLASH

  if (!isOpen) return null;

  // Render qismi 2-bo'limda...
/**
 * START: TRANSACTIONMODAL.TSX (2-BO'LIM)
 * UI Render: Tanlovlar iyerarxiyasi va Form dizayni.
 */

  const themeColor = type === 'income' ? '#00d4ff' : '#ff3366';
  const shadowColor = type === 'income' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 51, 102, 0.3)';

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col overflow-hidden animate-slideUp">
      
      {/* HEADER SECTION */}
      <div className="p-6 flex justify-between items-center shrink-0 border-b border-white/5">
        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
        <h3 className="text-sm font-black uppercase tracking-[0.3em] italic" style={{ color: themeColor }}>
            {initialData ? 'Tahrirlash' : 'Yangi Amal'}
        </h3>
        <div className="w-10"></div>
      </div>

      {view === 'main' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-area">
          
          {/* 1. TUR VA SUMMA */}
          <div className="space-y-4">
            <div className="flex bg-panel p-1 rounded-2xl border border-white/5">
                <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${type === 'expense' ? 'bg-[#ff3366] text-white shadow-lg shadow-rose-500/20' : 'text-gray-500'}`}>CHIQIM</button>
                <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${type === 'income' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-gray-500'}`}>KIRIM</button>
            </div>
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">UZS</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full bg-panel p-6 pl-16 rounded-[32px] text-3xl font-black text-white outline-none border border-white/5 focus:border-white/20 transition-all"
                />
            </div>
          </div>

          {/* 2. 3-BOSQICHLI KATEGORIYALAR (HIERARCHY) */}
          <div className="space-y-6">
            {/* BOSQICH 1: ASOSIY KATEGORIYA */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Tag size={12}/> Kategoriya</label>
                <button onClick={() => setView('new-cat')} className="p-1 bg-white/5 rounded-lg text-neon"><Plus size={16}/></button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.filter(c => c.type === type).map(cat => (
                  <button key={cat.id} onClick={() => { setCatId(cat.id); setSubId(''); setChildId(''); }} className={`px-5 py-3 rounded-2xl text-xs font-bold shrink-0 border transition-all ${catId === cat.id ? 'bg-neon text-black border-neon shadow-lg shadow-neon/20' : 'bg-panel text-gray-400 border-white/5'}`}>{cat.name}</button>
                ))}
              </div>
            </div>

            {/* BOSQICH 2: PODKATEGORIYA (SUB) */}
            {catId && (
              <div className="space-y-3 animate-slideUp">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Podkategoriya</label>
                  <button onClick={() => setView('new-sub')} className="p-1 bg-white/5 rounded-lg text-neon"><Plus size={16}/></button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.find(c => c.id === catId)?.subs?.map(sub => (
                    <button key={sub.id} onClick={() => { setSubId(sub.id); setChildId(''); }} className={`px-4 py-2 rounded-xl text-[10px] font-bold shrink-0 border transition-all ${subId === sub.id ? 'bg-white text-black' : 'bg-white/5 text-gray-500 border-white/5'}`}>{sub.name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* BOSQICH 3: QUYI KATEGORIYA (CHILD) */}
            {subId && (
              <div className="space-y-3 animate-slideUp">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-8">Quyi kategoriya</label>
                  <button onClick={() => setView('new-child')} className="p-1 bg-white/5 rounded-lg text-neon"><Plus size={16}/></button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.find(c => c.id === catId)?.subs?.find(s => s.id === subId)?.items?.map(ch => (
                    <button key={ch.id} onClick={() => setChildId(ch.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold shrink-0 border transition-all ${childId === ch.id ? 'bg-neon/20 text-neon border-neon/50' : 'bg-white/5 text-gray-600 border-white/5'}`}>{ch.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. HAMYON VA SANA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 flex items-center gap-2"><CreditCard size={12}/> Hamyon</label>
              <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-panel p-4 rounded-2xl border border-white/5 outline-none text-xs font-bold text-white">
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 flex items-center gap-2"><Calendar size={12}/> Sana</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-panel p-4 rounded-2xl border border-white/5 outline-none text-xs font-bold text-white"/>
            </div>
          </div>

          {/* 4. IZOH */}
          <div className="bg-panel p-4 rounded-[24px] border border-white/5">
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Izoh (ixtiyoriy)..." rows={2} className="w-full bg-transparent outline-none text-xs font-medium text-gray-300 resize-none"/>
          </div>

          {/* ASOSIY SAQLASH TUGMASI */}
          <button 
            disabled={!amount || !catId} 
            onClick={handleFinalSave} 
            className="w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
            style={{ background: themeColor, color: type === 'income' ? '#0a0e17' : '#fff', boxShadow: `0 10px 30px ${shadowColor}` }}
          >
            {initialData ? 'O\'zgarishlarni Saqlash' : 'Amalni Qo\'shish'}
          </button>
        </div>
      ) : (
        /* YANGI ELEMENT QO'SHISH FORMASI (CAT/SUB/CHILD) */
        <div className="flex-1 flex flex-col justify-center p-10 animate-slideUp">
          <button onClick={() => setView('main')} className="absolute top-10 left-6 text-gray-500"><ArrowLeft size={30}/></button>
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-4xl font-black italic tracking-tighter" style={{ color: themeColor }}>NOMINI YOZING</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.5em]">Yangi {view.split('-')[1]} yaratish</p>
          </div>
          <input 
            autoFocus 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)} 
            className="w-full bg-transparent border-b-4 text-3xl text-center text-white pb-6 outline-none transition-all focus:border-white"
            style={{ borderColor: themeColor }}
          />
          <button onClick={handleAddItem} className="mt-16 w-full py-6 rounded-[28px] font-black text-lg transition-all active:scale-95 shadow-2xl" style={{ background: themeColor, color: type === 'income' ? '#0a0e17' : '#fff' }}>
            YARATISH VA DAVOM ETISH
          </button>
        </div>
      )}
    </div>
  );
}
/** END OF TRANSACTIONMODAL.TSX **/
