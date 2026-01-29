/**
 * Loyihadagi asosiy ma'lumot turlari (Interfaces).
 * Har bir yangi AI modeli va sozlamasi shu yerda belgilanadi.
 */

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ChildCategory { id: string; name: string; }
export interface SubCategory { id: string; name: string; items?: ChildCategory[]; }
export interface Category { id: string; name: string; icon: string; type: TransactionType; subs?: SubCategory[]; }

export interface Wallet {
  id: string; name: string; type: 'cash' | 'card' | 'bank' | 'dollar'; balance: number; currency: 'UZS' | 'USD'; colorTheme?: string;
}

export interface Transaction {
  id: string; amount: number; type: TransactionType; walletId: string; categoryId: string; subCategoryId?: string; childCategoryId?: string; date: string; note?: string; exchangeRate?: number;
}

export interface AppSettings {
  userName: string;
  // pinCode olib tashlandi
  useBiometrics: boolean;
  themeColor: string;
  enable3D: boolean;
  geminiKey?: string;
  groqKey?: string;
  preferredProvider: 'gemini' | 'groq';
  customPrompt?: string;
  geminiModel: string; 
  groqModel: string;
  aiModel: string; // Eski versiya bilan moslik uchun qoldirildi
}

export interface AppProfile { name: string; avatar: string; }

export interface AppData {
  profile: AppProfile; settings: AppSettings; wallets: Wallet[]; transactions: Transaction[]; categories: Category[];
}

export interface FilterState {
  walletId?: string; categoryId?: string; subCategoryId?: string; childCategoryId?: string; startDate?: string; endDate?: string; type?: TransactionType | 'all';
}
