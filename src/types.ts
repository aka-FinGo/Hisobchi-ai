export type TransactionType = 'income' | 'expense';
export type Currency = 'UZS' | 'USD';

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'dollar';
  balance: number;
  currency: Currency;
  colorTheme?: string;
}

// 3-darajali tuzilma
export interface SubItem {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;
  items: SubItem[]; // Quyi kategoriyalar (Masalan: Yanvar, Fevral)
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  subs: SubCategory[]; // Podkategoriyalar (Masalan: Ish haqi)
}

export interface Transaction {
  id: string;
  amount: number;
  walletId: string;
  type: TransactionType;
  
  // Ierarxiya
  categoryId: string;
  subCategoryId?: string;
  childCategoryId?: string; // 3-daraja
  
  date: string;
  note?: string;
  location?: string; // Lokatsiya
}

export interface AppData {
  profile: any;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
}
