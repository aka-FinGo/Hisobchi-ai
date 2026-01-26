import { Zap, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

export default function HomePage({ data }: { data: AppData }) {
  const currentMonth = new Date().getMonth();
  const monthlyTxs = data.transactions.filter(t => new Date(t.date).getMonth() === currentMonth);
  
  const income = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-8 pb-32 overflow-y-auto h-full scrollbar-hide">
      <div className="flex justify-between items-center mt-4">
        <div>
          <h1 className="text-3xl font-black neon-text-blue italic uppercase tracking-tighter">Cyber-Finance</h1>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">aka_FinGo / {data.profile.name}</p>
        </div>
        <div className="w-12 h-12 rounded-xl neon-border-blue overflow-hidden p-1">
          <img src={data.profile.avatar} className="rounded-lg" alt="Profile" />
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="glass-neon rounded-[35px] p-8 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-all"></div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Joriy Balans</p>
        <h2 className="text-5xl font-black text-white tracking-tighter mb-6">
          {data.wallets[0].balance.toLocaleString()} <span className="text-lg text-blue-500">UZS</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
            <TrendingUp className="text-emerald-400 mb-1" size={18} />
            <p className="text-[10px] text-gray-400 uppercase">Kirim</p>
            <p className="font-bold text-emerald-400 text-sm">+{income.toLocaleString()}</p>
          </div>
          <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
            <TrendingDown className="text-rose-400 mb-1" size={18} />
            <p className="text-[10px] text-gray-400 uppercase">Chiqim</p>
            <p className="font-bold text-rose-400 text-sm">-{expense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Mini Budget Indicators */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" /> Byudjet Nazorati
        </h3>
        {data.budgets.slice(0, 2).map(b => {
          const progress = (b.spent / b.limit) * 100;
          return (
            <div key={b.categoryId} className="glass-neon p-4 rounded-2xl">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-gray-300">{data.categories.find(c => c.id === b.categoryId)?.name}</span>
                <span className="text-xs font-bold text-blue-400">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`} 
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
