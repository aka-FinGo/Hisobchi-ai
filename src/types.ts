export type TransactionType = 'income' | 'expense';

export type WalletType = 'cash' | 'card' | 'dollar';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  walletId: string;
  type: TransactionType;
  date: string;
  note?: string;
}

export interface AppData {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  settings: {
    apiKey: string;
  };
}
