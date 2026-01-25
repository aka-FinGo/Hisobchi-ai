import { Wallet as WalletIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Wallet, Transaction, Category } from '../types';

interface HomePageProps {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
}

export default function HomePage({ wallets, transactions, categories }: HomePageProps) {
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });

  const monthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Noma\'lum';
  };

  const getWalletName = (walletId: string) => {
    return wallets.find((w) => w.id === walletId)?.name || 'Noma\'lum';
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} so'm`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Asosiy</h1>

      <div className="mb-6">
        <h2 className="text-sm text-gray-400 mb-3">Hamyonlar</h2>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <WalletIcon size={20} className="text-white" />
                  <span className="text-white font-medium">{wallet.name}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(wallet.balance, wallet.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm text-gray-400 mb-3">Shu oy</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-green-500" />
              <span className="text-gray-400 text-sm">Daromad</span>
            </div>
            <div className="text-xl font-bold text-white">
              {monthIncome.toLocaleString()} so'm
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={20} className="text-red-500" />
              <span className="text-gray-400 text-sm">Chiqim</span>
            </div>
            <div className="text-xl font-bold text-white">
              {monthExpense.toLocaleString()} so'm
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm text-gray-400 mb-3">So'nggi tranzaksiyalar</h2>
        {recentTransactions.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400">Hali tranzaksiya yo'q</p>
            <p className="text-gray-500 text-sm mt-1">
              + tugmasini bosib yangi tranzaksiya qo'shing
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {getCategoryName(transaction.categoryId)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {getWalletName(transaction.walletId)} •{' '}
                    {new Date(transaction.date).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
