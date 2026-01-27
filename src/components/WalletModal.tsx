import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wallet: any) => void;
  initialData?: any; // Yangi prop
}

export default function WalletModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'cash' | 'card'>('cash');

  // Edit Mode Logic
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCurrency(initialData.currency);
      setBalance(initialData.balance.toString());
      setType(initialData.type === 'dollar' ? 'cash' : initialData.type);
    } else {
      setName('');
      setCurrency('UZS');
      setBalance('');
      setType('cash');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      id: initialData ? initialData.id : `w_${Date.now()}`, // ID saqlanadi
      name,
      currency,
      balance: parseFloat(balance) || 0,
      type: type === 'cash' && currency === 'USD' ? 'dollar' : type,
      colorTheme: 'orange'
    });
    setName('');
    setBalance('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-slideUp">
       <div className="w-full max-w-sm bg-[#141e3c] rounded-3xl p-6 border border-[#00d4ff]/30 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-white font-bold text-lg uppercase tracking-widest text-[#00d4ff]">
                {initialData ? 'Hamyonni Tahrirlash' : 'Yangi Hamyon'}
             </h3>
             <button onClick={onClose}><X className="text-gray-400"/></button>
          </div>

          <div className="space-y-4 mb-6">
             <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase">Nomi</label>
                <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: Uy seyfi" className="w-full bg-[#0a0e17] border border-white/10 rounded-xl p-3 text-white focus:border-[#00d4ff] outline-none mt-1"/>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCurrency('UZS')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${currency === 'UZS' ? 'bg-[#00d4ff]/20 border-[#00d4ff] text-[#00d4ff]' : 'border-white/10 text-gray-500'}`}>So'm</button>
                <button onClick={() => setCurrency('USD')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${currency === 'USD' ? 'bg-[#bb86fc]/20 border-[#bb86fc] text-[#bb86fc]' : 'border-white/10 text-gray-500'}`}>Dollar</button>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setType('cash')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${type === 'cash' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}><Wallet size={16}/> Naqd</button>
                <button onClick={() => setType('card')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${type === 'card' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}><CreditCard size={16}/> Karta</button>
             </div>

             <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase">Balans</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="w-full bg-[#0a0e17] border border-white/10 rounded-xl p-3 text-white focus:border-[#00d4ff] outline-none mt-1"/>
             </div>
          </div>

          <button disabled={!name} onClick={handleSave} className="w-full py-3 bg-[#00d4ff] hover:bg-[#00b4d8] text-[#0a0e17] font-bold rounded-xl transition-colors disabled:opacity-50">SAQLASH</button>
       </div>
    </div>
  );
}
