import { X, Edit2, Trash2, Calendar, Wallet } from 'lucide-react';
import * as Icons from 'lucide-react';

const DynamicIcon = ({ name }: { name: string }) => {
  const Icon = (Icons as any)[name] || Icons.Circle;
  return <Icon size={40} />;
};

export default function TransactionDetailModal({ isOpen, onClose, transaction, category, wallet, onEdit, onDelete }: any) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
       <div className="w-full max-w-sm bg-[#18181b] rounded-[32px] p-6 border border-white/10 block-3d relative">
          
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>

          <div className="flex flex-col items-center mb-6">
             <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 ${transaction.type === 'income' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-rose-500 text-rose-500 bg-rose-500/10'}`}>
                <DynamicIcon name={category?.icon} />
             </div>
             <h2 className="text-3xl font-black text-white">{transaction.amount.toLocaleString()} <span className="text-lg text-gray-500 font-bold">{wallet?.currency}</span></h2>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{category?.name}</p>
          </div>

          <div className="space-y-4 mb-8">
             <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 text-gray-400">
                   <Calendar size={18}/> <span className="text-xs font-bold uppercase">Sana</span>
                </div>
                <span className="text-white font-bold text-sm">{transaction.date}</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 text-gray-400">
                   <Wallet size={18}/> <span className="text-xs font-bold uppercase">Hamyon</span>
                </div>
                <span className="text-white font-bold text-sm">{wallet?.name}</span>
             </div>
             {transaction.note && (
               <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-sm text-gray-300 italic">
                  "{transaction.note}"
               </div>
             )}
          </div>

          <div className="flex gap-3">
             <button onClick={() => { onEdit(transaction); onClose(); }} className="flex-1 py-3 bg-blue-600/20 text-blue-400 font-bold rounded-xl border border-blue-600/50 hover:bg-blue-600/30 flex items-center justify-center gap-2">
                <Edit2 size={18}/> Tahrirlash
             </button>
             <button onClick={() => { if(confirm("O'chirilsinmi?")) { onDelete(transaction.id); onClose(); } }} className="flex-1 py-3 bg-rose-600/20 text-rose-500 font-bold rounded-xl border border-rose-600/50 hover:bg-rose-600/30 flex items-center justify-center gap-2">
                <Trash2 size={18}/> O'chirish
             </button>
          </div>

       </div>
    </div>
  );
}
