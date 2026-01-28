export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  subs?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  items?: ChildCategory[];
}

export interface ChildCategory {
  id: string;
  name: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank' | 'dollar';
  balance: number;
  currency: 'UZS' | 'USD';
  colorTheme?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  walletId: string;
  categoryId: string;
  subCategoryId?: string;
  childCategoryId?: string;
  date: string;
  note?: string;
  exchangeRate?: number;
}

export interface AppProfile {
  name: string;
  avatar: string;
}

export interface AppData {
  profile: AppProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
}

// YANGI: Filterlash uchun obyekt
export interface FilterState {
  walletId?: string;
  categoryId?: string;
  subCategoryId?: string;
  childCategoryId?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
}
