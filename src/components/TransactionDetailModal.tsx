import { useState } from 'react';
import { X, Edit2, Trash2, MapPin, Calendar, Wallet, Tag, ArrowRight, ExternalLink, Filter } from 'lucide-react';
import { Transaction, Category, Wallet as WalletType, FilterState } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category?: Category;
  wallet?: WalletType;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onFilter: (filter: FilterState) => void;
}

export default function TransactionDetailModal({ isOpen, onClose, transaction, category, wallet, onEdit, onDelete, onFilter }: Props) {
  const [showLocMenu, setShowLocMenu] = useState(false);

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';
  const themeColor = isIncome ? '#00d4ff' : '#ff3366';

  const sub = category?.subs?.find(s => s.id === transaction.subCategoryId);
  const child = sub?.items?.find(i => i.id === transaction.childCategoryId);

  // LOKATSIYANI TEKSHIRISH (Aniqroq logika)
  const isCoordinates = (str?: string) => {
    if (!str) return false;
    // Oddiy regex: "raqam,raqam" formati (va bo'sh joylar)
    const parts = str.split(',');
    if (parts.length !== 2) return false;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lng);
  };

  const hasLocation = isCoordinates(transaction.note);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-slideUp">
      <div className="w-full max-w-md bg-[#0a0e17] rounded-[30px] overflow-hidden border border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* HEADER */}
        <div className="h-32 relative flex items-center justify-center" style={{ background: `linear-gradient(180deg, ${themeColor}20, transparent)` }}>
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white hover:bg-black/40"><X size={20}/></button>
            </div>
            
            <div className="text-center z-10">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Jami Summa</p>
                <h2 className="text-4xl font-bold text-white drop-shadow-md">
                    {transaction.amount.toLocaleString()} 
                    <span className="text-lg ml-1 text-gray-400">{wallet?.currency}</span>
                </h2>
                {wallet?.currency === 'USD' && transaction.exchangeRate && (
                    <p className="text-[10px] text-yellow-500 font-mono mt-1">Kurs: {transaction.exchangeRate} UZS</p>
                )}
            </div>
        </div>

        {/* DETAILS LIST */}
        <div className="p-6 space-y-4">
            
            {/* 1. HAMYON (Click -> Filter) */}
            <div onClick={() => onFilter({ walletId: wallet?.id })} className="bg-[#141e3c]/50 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#141e3c] border border-white/5 active:scale-95 transition-all group">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5"><Wallet size={18} className="text-gray-400 group-hover:text-white"/></div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Hamyon</p>
                        <p className="text-white font-bold">{wallet?.name}</p>
                    </div>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-[#00d4ff]"/>
            </div>

            {/* 2. KATEGORIYA (Click -> Filter) */}
            <div className="bg-[#141e3c]/50 p-4 rounded-2xl cursor-pointer hover:bg-[#141e3c] border border-white/5 active:scale-95 transition-all group"
                 onClick={() => onFilter({ categoryId: category?.id, subCategoryId: sub?.id, childCategoryId: child?.id })}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-white/5"><Tag size={18} className="text-gray-400 group-hover:text-white"/></div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Kategoriya</p>
                        <p className="text-white font-bold">{category?.name}</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-[#00d4ff]"/>
                </div>
                {(sub || child) && (
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 pl-11">
                        {sub && <span>↳ {sub.name}</span>}
                        {child && <span>➜ {child.name}</span>}
                    </div>
                )}
            </div>

            {/* 3. LOKATSIYA (FIXED: Faqat koordinata bo'lsa chiqadi) */}
            {hasLocation ? (
               <div className="relative">
                   <div onClick={() => setShowLocMenu(!showLocMenu)} className="bg-[#141e3c]/50 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#141e3c] border border-white/5 active:scale-95 transition-all">
                       <div className="p-2 rounded-xl bg-white/5"><MapPin size={18} className="text-[#00d4ff]"/></div>
                       <div>
                           <p className="text-[10px] text-gray-500 uppercase font-bold">Lokatsiya</p>
                           <p className="text-white font-bold text-xs">{transaction.note}</p>
                       </div>
                   </div>
                   
                   {/* Map Popup */}
                   {showLocMenu && (
                       <div className="absolute top-full left-0 w-full mt-2 bg-[#141e3c] border border-white/10 rounded-xl p-2 shadow-2xl z-20 animate-slideUp">
                           <a href={`https://www.google.com/maps/search/?api=1&query=${transaction.note}`} target="_blank" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white text-sm font-bold">
                               <ExternalLink size={16} className="text-green-400"/> Xaritada ochish
                           </a>
                           <button onClick={() => onFilter({ location: transaction.note })} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white text-sm font-bold text-left">
                               <Filter size={16} className="text-[#00d4ff]"/> Shu joy bo'yicha filter
                           </button>
                       </div>
                   )}
               </div>
            ) : null}

            {/* 4. SANA (Click -> Filter) VA IZOH */}
            <div className="grid grid-cols-2 gap-3">
                {/* SANA CLICK FIX */}
                <div 
                    onClick={() => onFilter({ startDate: transaction.date, endDate: transaction.date })}
                    className="bg-[#141e3c]/50 border border-white/5 rounded-2xl p-3 flex flex-col justify-center cursor-pointer hover:bg-[#141e3c] active:scale-95"
                >
                    <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> Sana</p>
                    <p className="text-white font-bold text-sm">{transaction.date}</p>
                </div>

                {/* IZOH (Agar lokatsiya bo'lmasa) */}
                {(!hasLocation && transaction.note) && (
                     <div className="bg-[#141e3c]/50 border border-white/5 rounded-2xl p-3 flex flex-col justify-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Izoh</p>
                        <p className="text-white text-xs line-clamp-2">{transaction.note}</p>
                     </div>
                )}
            </div>
        </div>

        {/* ACTIONS */}
        <div className="p-4 bg-[#05070a]/50 border-t border-white/5 flex gap-3">
            <button onClick={() => onEdit(transaction)} className="flex-1 py-4 rounded-xl bg-[#141e3c] text-white font-bold uppercase text-xs hover:bg-[#1e2a44] transition-colors flex items-center justify-center gap-2">
                <Edit2 size={16}/> Tahrirlash
            </button>
            <button onClick={() => onDelete(transaction.id)} className="flex-1 py-4 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold uppercase text-xs hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2">
                <Trash2 size={16}/> O'chirish
            </button>
        </div>

      </div>
    </div>
  );
}
