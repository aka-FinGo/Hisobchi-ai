import { useState } from 'react';
import { X, Wallet, CreditCard, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wallet: any) => void;
}

export default function WalletModal({ isOpen, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'cash' | 'card'>('cash');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      id: `w_${Date.now()}`,
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
       <div className="w-full max-w-sm bg-[#18181b] rounded-3xl p-6 border border-white/10 block-3d">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-white font-bold text-lg">Yangi Hamyon</h3>
             <button onClick={onClose}><X className="text-gray-400"/></button>
          </div>

          <div className="space-y-4 mb-6">
             {/* Nom */}
             <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase">Nomi</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: Uy seyfi" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none mt-1"/>
             </div>

             {/* Valyuta */}
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCurrency('UZS')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${currency === 'UZS' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'border-white/10 text-gray-500'}`}>
                   So'm (UZS)
                </button>
                <button onClick={() => setCurrency('USD')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${currency === 'USD' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/10 text-gray-500'}`}>
                   Dollar ($)
                </button>
             </div>

             {/* Turi */}
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setType('cash')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${type === 'cash' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}>
                   <Wallet size={16}/> Naqd
                </button>
                <button onClick={() => setType('card')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${type === 'card' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}>
                   <CreditCard size={16}/> Karta
                </button>
             </div>

             {/* Boshlang'ich Balans */}
             <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase">Boshlang'ich Balans</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none mt-1"/>
             </div>
          </div>

          <button disabled={!name} onClick={handleSave} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
             Saqlash
          </button>
       </div>
    </div>
  );
}
