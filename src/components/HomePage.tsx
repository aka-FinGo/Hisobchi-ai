import { Wallet, TrendingUp, TrendingDown, Bell, CreditCard, DollarSign } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';

interface HomePageProps {
  wallets: WalletType[];
  transactions: Transaction[];
  categories: Category[];
}

export default function HomePage({ wallets, transactions, categories }: HomePageProps) {
  // Umumiy balans
  const totalBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.currency === 'USD' ? wallet.balance * 12500 : wallet.balance);
  }, 0);

  const getCategoryName = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name || 'Noma\'lum';
  const getCategoryIcon = (categoryId: string) => categories.find((c) => c.id === categoryId)?.icon || 'Circle';
  
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Rangli kartalar uchun funksiya
  const getCardGradient = (index: number) => {
    const gradients = [
      'from-blue-600 to-purple-600', // Card 1
      'from-emerald-500 to-teal-600', // Card 2
      'from-orange-500 to-red-500',   // Card 3
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="h-full overflow-y-auto pb-32 scrollbar-hide">
      {/* 1. Header & Total Balance */}
      <div className="pt-safe px-6 pb-6 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex justify-between items-center mb-6 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-[2px]">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="rounded-full bg-black" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Xush kelibsiz</p>
              <h2 className="text-white text-lg font-bold">aka_FinGo</h2>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95 transition-transform">
            <Bell size={20} className="text-gray-300" />
          </button>
        </div>

        <div className="text-center py-4">
          <p className="text-gray-400 text-sm mb-1">Umumiy balans</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {totalBalance.toLocaleString()} <span className="text-lg text-gray-500 font-normal">UZS</span>
          </h1>
        </div>
      </div>

      {/* 2. Wallets (Cards Slider) */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Hamyonlar</h3>
          <button className="text-blue-400 text-sm font-medium">Hammasi</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x">
          {wallets.map((wallet, index) => (
            <div 
              key={wallet.id} 
              className={`snap-center flex-shrink-0 w-[280px] h-[160px] rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br ${getCardGradient(index)} shadow-lg shadow-black/20`}
            >
              {/* Dekorativ doiralar */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{wallet.name}</p>
                    <p className="text-white/60 text-xs mt-1">**** **** **** 4291</p>
                  </div>
                  {wallet.type === 'dollar' ? <DollarSign className="text-white/80"/> : <CreditCard className="text-white/80"/>}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {wallet.currency === 'USD' ? '$' : ''}{wallet.balance.toLocaleString()}
                    {wallet.currency === 'UZS' ? ' UZS' : ''}
                  </h3>
                </div>
              </div>
            </div>
          ))}
          {/* Yangi karta qo'shish placeholder */}
          <div className="snap-center flex-shrink-0 w-[60px] flex items-center justify-center">
             <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-gray-400">
               +
             </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Transactions */}
      <div className="px-6 bg-gray-900/50 min-h-[500px] rounded-t-[40px] border-t border-white/5 pt-8 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
           <div className="w-12 h-1 bg-gray-700 rounded-full opacity-50"></div>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-6">Oxirgi harakatlar</h3>

        <div className="space-y-4">
          {recentTransactions.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform duration-200">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  t.type === 'income' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{getCategoryName(t.categoryId)}</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    {t.note || new Date(t.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-bold ${
                  t.type === 'income' ? 'text-emerald-400' : 'text-white'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                </p>
                <p className="text-gray-500 text-[10px]">UZS</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
