import { Wallet as WalletIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Wallet, Transaction, Category } from '../types';

interface HomePageProps {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
}

export default function HomePage({ wallets, transactions, categories }: HomePageProps) {
  const totalBalance = wallets.reduce((sum, wallet) => {
    // Agar dollar bo'lsa kursni hisobga olish kerak (bu yerda soddalashtirilgan)
    return sum + (wallet.currency === 'USD' ? wallet.balance * 12500 : wallet.balance);
  }, 0);

  const getCategoryName = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name || 'Noma\'lum';
  const getWalletName = (walletId: string) => wallets.find((w) => w.id === walletId)?.name || 'Noma\'lum';
  const getCategoryIcon = (categoryId: string) => categories.find((c) => c.id === categoryId)?.icon || 'Circle';

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-4 space-y-6 pb-24 pt-safe">
      {/* Glassmorphism Balance Card */}
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl overflow-hidden border border-white/10">
        {/* Orqa fon effektlari */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-blue-200 text-sm font-medium">Umumiy balans</span>
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <WalletIcon size={20} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            {totalBalance.toLocaleString()} <span className="text-lg font-normal text-blue-200">UZS</span>
          </h1>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-xs text-blue-200">Kirim</p>
                <p className="font-semibold text-sm">Faol</p>
              </div>
            </div>
            <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full text-red-400">
                <TrendingDown size={18} />
              </div>
              <div>
                <p className="text-xs text-blue-200">Chiqim</p>
                <p className="font-semibold text-sm">Faol</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hamyonlar qatori */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="min-w-[140px] bg-gray-800 p-4 rounded-2xl border border-gray-700 flex flex-col justify-between">
            <p className="text-gray-400 text-xs">{wallet.name}</p>
            <p className="text-white font-bold mt-1">
              {wallet.balance.toLocaleString()} <span className="text-xs font-normal">{wallet.currency}</span>
            </p>
          </div>
        ))}
      </div>

      {/* So'nggi tranzaksiyalar */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-3 px-1">So'nggi harakatlar</h2>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed">
              Hozircha tranzaksiyalar yo'q
            </div>
          ) : (
            recentTransactions.map((t) => (
              <div key={t.id} className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 flex items-center justify-between active:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Kategoriya Ikonkasi (Dinamik bo'lishi mumkin) */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">{getCategoryName(t.categoryId)}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      {getWalletName(t.walletId)} • {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <span className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
