import { Wallet, TrendingUp, TrendingDown, Bell, CreditCard, DollarSign, Wallet as WalletIcon } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';
import * as Icons from 'lucide-react';

interface HomePageProps {
  wallets: WalletType[];
  transactions: Transaction[];
  categories: Category[];
}

// Ikonka render qiluvchi yordamchi
const DynamicIcon = ({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} className={className} />;
};

export default function HomePage({ wallets, transactions, categories }: HomePageProps) {
  // Umumiy balans (UZS da hisoblash)
  const totalBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.currency === 'USD' ? wallet.balance * 12600 : wallet.balance);
  }, 0);

  const getCategory = (id: string) => categories.find((c) => c.id === id);
  
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="h-full overflow-y-auto pb-32 scrollbar-hide">
      {/* Header & Total Balance */}
      <div className="pt-safe px-6 pb-8 bg-gradient-to-b from-blue-600/10 to-transparent">
        <div className="flex justify-between items-center mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px] shadow-lg shadow-blue-500/20">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=aka_FinGo`} alt="Avatar" className="rounded-2xl bg-gray-900" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Salom,</p>
              <h2 className="text-white text-lg font-bold tracking-tight">aka_FinGo</h2>
            </div>
          </div>
          <button className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
            <Bell size={22} />
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium mb-1">Jami mablag'ingiz</p>
          <div className="flex items-baseline justify-center gap-2">
             <h1 className="text-4xl font-black text-white tracking-tighter">
               {totalBalance.toLocaleString()}
             </h1>
             <span className="text-blue-500 font-bold text-lg">UZS</span>
          </div>
        </div>
      </div>

      {/* Wallets - Horizontal Slider */}
      <div className="px-6 mb-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white tracking-tight">Mening kartalarim</h3>
          <button className="text-blue-400 text-sm font-bold">Barchasi</button>
        </div>
        
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x">
          {wallets.map((wallet) => (
            <div 
              key={wallet.id} 
              className={`snap-center flex-shrink-0 w-[280px] h-[170px] rounded-[32px] p-6 relative overflow-hidden bg-gradient-to-br ${wallet.colorTheme || 'from-gray-700 to-gray-900'} shadow-2xl shadow-black/40`}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/20 rounded-full blur-2xl"></div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{wallet.name}</p>
                    <p className="text-white/40 text-[10px] font-mono">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</p>
                  </div>
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    {wallet.type === 'dollar' ? <DollarSign size={18} className="text-white"/> : <CreditCard size={18} className="text-white"/>}
                  </div>
                </div>
                
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Balans</p>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {wallet.currency === 'USD' ? '$' : ''}{wallet.balance.toLocaleString()}
                    {wallet.currency === 'UZS' ? ' UZS' : ''}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-900/50 min-h-[400px] rounded-t-[48px] border-t border-white/5 pt-10 px-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold text-white tracking-tight">Oxirgi harakatlar</h3>
           <TrendingUp size={20} className="text-gray-600" />
        </div>

        <div className="space-y-5">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">Hali tranzaksiyalar yo'q</p>
            </div>
          ) : (
            recentTransactions.map((t) => {
              const cat = getCategory(t.categoryId);
              return (
                <div key={t.id} className="glass-card rounded-[24px] p-4 flex items-center justify-between active:scale-[0.97] transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      t.type === 'income' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      <DynamicIcon name={cat?.icon || 'Circle'} size={22} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">
                        {cat?.name} {t.subCategory && <span className="text-gray-500 font-normal">/ {t.subCategory}</span>}
                      </h4>
                      <p className="text-gray-500 text-[10px] mt-1 font-medium">
                        {t.note || new Date(t.date).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-black text-sm tracking-tight ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <p className="text-gray-600 text-[9px] font-bold uppercase tracking-tighter">UZS</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
