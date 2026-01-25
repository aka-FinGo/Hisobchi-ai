import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Bell } from 'lucide-react';
import { Wallet as WalletType, Transaction, Category } from '../types';

interface HomePageProps {
  wallets: WalletType[];
  transactions: Transaction[];
  categories: Category[];
}

export default function HomePage({ wallets, transactions, categories }: HomePageProps) {
  // Umumiy balansni hisoblash
  const totalBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.currency === 'USD' ? wallet.balance * 12500 : wallet.balance);
  }, 0);

  const getCategoryName = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name || 'Noma\'lum';
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Faqat oxirgi 5 tasini ko'rsatish

  return (
    <div className="p-5 space-y-8 pb-32 pt-safe font-['Plus_Jakarta_Sans']">
      
      {/* 1. Header: Salomlashish va Profil */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-sm font-medium">Xush kelibsiz 👋</p>
          <h2 className="text-white text-xl font-bold">Mening Hamyonim</h2>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center relative">
          <Bell size={20} className="text-gray-300" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-gray-800"></div>
        </div>
      </div>

      {/* 2. PREMIUM BALANCE CARD (Siz yuborgan dizayndagi kabi) */}
      <div className="relative w-full h-48 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-500/20">
        {/* Orqa fon gradienti */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#DB2777]"></div>
        
        {/* Dekorativ doiralar (Glass effect) */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>

        {/* Karta ichidagi ma'lumotlar */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Umumiy Balans</p>
              <h1 className="text-3xl font-bold tracking-tight">
                {totalBalance.toLocaleString()} <span className="text-lg opacity-70">UZS</span>
              </h1>
            </div>
            {/* Chip */}
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold">Active</span>
            </div>
          </div>

          {/* Kirim/Chiqim statistika qatori */}
          <div className="flex gap-4">
            <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl p-2 flex items-center gap-3 pr-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingDown size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/70">Xarajat</p>
                <p className="text-sm font-bold">340.000</p>
              </div>
            </div>
            <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl p-2 flex items-center gap-3 pr-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/70">Kirim</p>
                <p className="text-sm font-bold">1.2M</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HAMYONLAR (Gorizontal Scroll) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">Hamyonlarim</h3>
          <button className="text-blue-500 text-sm">Barchasi</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="min-w-[150px] bg-[#1F2937] p-4 rounded-3xl border border-gray-700/50 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                <Wallet size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium">{wallet.name}</p>
                <p className="text-white font-bold text-lg">
                  {wallet.balance.toLocaleString()} 
                  <span className="text-xs text-gray-500 ml-1">{wallet.currency}</span>
                </p>
              </div>
            </div>
          ))}
          {/* Qo'shish kartasi */}
          <div className="min-w-[60px] flex items-center justify-center">
            <button className="w-12 h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. SO'NGGI TRANZAKSIYALAR (Clean List) */}
      <div>
        <h3 className="text-white font-bold text-lg mb-4">So'nggi o'tkazmalar</h3>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Hozircha bo'sh</p>
          ) : (
            recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between group active:scale-95 transition-transform">
                <div className="flex items-center gap-4">
                  {/* Ikonka konteyneri */}
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${
                    t.type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {t.type === 'income' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                  
                  <div>
                    <h4 className="text-white font-bold text-base">{getCategoryName(t.categoryId)}</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(t.date).toLocaleDateString()} • {t.note || "Izohsiz"}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold text-base ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs">UZS</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
