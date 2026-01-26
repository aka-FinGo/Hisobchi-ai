import { TrendingUp, TrendingDown, Bell, CreditCard, DollarSign } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';
import * as Icons from 'lucide-react';

interface HomePageProps {
  wallets: WalletType[];
  transactions: Transaction[];
  categories: Category[];
}

const DynamicIcon = ({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} className={className} />;
};

export default function HomePage({ wallets, transactions, categories }: HomePageProps) {
  // Umumiy balansni UZS da hisoblash
  const totalBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.currency === 'USD' ? wallet.balance * 12600 : wallet.balance);
  }, 0);

  const getCategory = (id: string) => categories.find((c) => c.id === id);
  
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Kartalar uchun gradientlar ro'yxati
  const cardGradients = [
    'from-blue-600 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-500',
  ];

  return (
    <div className="h-full overflow-y-auto pb-32 scrollbar-hide">
      
      {/* 1. Header & Total Balance */}
      <div className="pt-safe px-6 pb-8 bg-gradient-to-b from-blue-500/10 to-transparent">
        <div className="flex justify-between items-center mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=aka_FinGo" alt="Avatar" className="rounded-2xl bg-gray-900" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Salom,</p>
              <h2 className="text-white text-lg font-bold">aka_FinGo</h2>
            </div>
          </div>
          <button className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
            <Bell size={22} />
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium mb-1">Jami balans</p>
          <div className="flex items-baseline justify-center gap-2">
             <h1 className="text-4xl font-black text-white tracking-tighter">
               {totalBalance.toLocaleString()}
             </h1>
             <span className="text-blue-400 font-bold text-lg">UZS</span>
          </div>
        </div>
      </div>

      {/* 2. Wallets (Rangli Kartalar Slayderi) */}
      <div className="px-6 mb-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white tracking-tight">Hamyonlar</h3>
          <button className="text-blue-400 text-sm font-bold">Barchasi</button>
        </div>
        
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x">
          {wallets.map((wallet, index) => (
            <div 
              key={wallet.id} 
              className={`snap-center flex-shrink-0 w-[290px] h-[175px] rounded-[32px] p-6 relative overflow-hidden bg-gradient-to-br ${cardGradients[index % cardGradients.length]} shadow-2xl shadow-black/40`}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/20 rounded-full blur-2xl"></div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{wallet.name}</p>
                    <p className="text-white/40 text-[10px] font-mono mt-1">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</p>
                  </div>
                  <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
                    {wallet.currency === 'USD' ? <DollarSign size={20} className="text-white"/> : <CreditCard size={20} className="text-white"/>}
                  </div>
                </div>
                
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Joriy balans</p>
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

      {/* 3. Recent Transactions (Shishasimon Ro'yxat) */}
      <div className="bg-[#020617]/40 min-h-[400px] rounded-t-[48px] border-t border-white/5 pt-10 px-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold text-white tracking-tight">Oxirgi harakatlar</h3>
           <button className="text-gray-500 hover:text-white transition-colors"><TrendingUp size={20}/></button>
        </div>

        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-600 italic">Hali tranzaksiyalar mavjud emas</div>
          ) : (
            recentTransactions.map((t) => {
              const cat = getCategory(t.categoryId);
              return (
                <div key={t.id} className="glass-card rounded-[28px] p-4 flex items-center justify-between active:scale-[0.97] transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      t.type === 'income' 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      <DynamicIcon name={cat?.icon || 'Circle'} size={22} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">
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
