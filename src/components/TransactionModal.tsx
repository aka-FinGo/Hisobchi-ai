/**
 * START: TRANSACTIONMODAL.TSX
 * 3 bosqichli kategoriya yaratish mantiqi.
 */

import { useState } from 'react';
import { X, ArrowLeft, Plus, Check } from 'lucide-react';

export default function TransactionModal({ isOpen, onClose, onSave, categories, onUpdateCategories }: any) {
  const [view, setView] = useState<'main' | 'new-cat' | 'new-sub' | 'new-child'>('main');
  const [newItemName, setNewItemName] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // START: YANGI ELEMENT QO'SHISH (Kategoriya/Sub/Child)
  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const updatedCats = [...categories];

    if (view === 'new-cat') {
      updatedCats.push({ id: `c_${Date.now()}`, name: newItemName, icon: 'Tag', type: 'expense', subs: [] });
    } 
    else if (view === 'new-sub' && selectedCat) {
      const cat = updatedCats.find(c => c.id === selectedCat);
      if (cat) cat.subs = [...(cat.subs || []), { id: `s_${Date.now()}`, name: newItemName, items: [] }];
    } 
    else if (view === 'new-child' && selectedCat && selectedSub) {
      const cat = updatedCats.find(c => c.id === selectedCat);
      const sub = cat?.subs?.find(s => s.id === selectedSub);
      if (sub) sub.items = [...(sub.items || []), { id: `ch_${Date.now()}`, name: newItemName }];
    }

    onUpdateCategories(updatedCats);
    setNewItemName('');
    setView('main');
  };
  // END: QO'SHISH MANTIQI

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col">
       {view === 'main' ? (
         <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic">AMAL QO'SHISH</h3>
                <button onClick={onClose}><X/></button>
            </div>
            {/* Kategoriya Tanlash va "+" tugmalari */}
            <div className="flex gap-2 overflow-x-auto pb-4">
                <button onClick={() => setView('new-cat')} className="p-4 bg-neon/10 border border-neon/20 rounded-2xl text-neon"><Plus/></button>
                {categories.map((c: any) => (
                    <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`p-4 rounded-2xl border ${selectedCat === c.id ? 'bg-neon text-black' : 'bg-panel border-white/5'}`}>{c.name}</button>
                ))}
            </div>
            {/* Sub va Child uchun ham shunday "+" tugmalari... */}
         </div>
       ) : (
         <div className="flex-1 flex flex-col justify-center p-8 animate-slideUp">
            <button onClick={() => setView('main')} className="absolute top-10 left-6 text-gray-500"><ArrowLeft/></button>
            <h2 className="text-neon font-black text-center mb-8 uppercase tracking-widest">Nomini kiriting</h2>
            <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-transparent border-b-2 border-neon text-2xl text-center text-white pb-4 outline-none"/>
            <button onClick={handleAddItem} className="mt-12 w-full py-5 bg-neon text-black rounded-2xl font-black">SAQLASH</button>
         </div>
       )}
    </div>
  );
}
