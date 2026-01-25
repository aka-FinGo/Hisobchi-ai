export type TransactionType = 'income' | 'expense';
export type WalletType = 'cash' | 'card' | 'dollar';
export type AIProvider = 'gemini' | 'groq' | 'openai';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  subCategories?: string[]; // Podkategoriyalar
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
  subCategory?: string; // Aniqroq: "Zakaz 123"
  walletId: string;
  type: TransactionType;
  date: string;       // Tranzaksiya bo'lgan vaqt
  period?: string;    // Qaysi davr uchun (Masalan: "2023-12" dekabr oyligi)
  note?: string;
}

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  tokensUsed: number;
  tokenLimit: number; // Ogohlantirish uchun
}

export interface AppData {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  aiSettings: AISettings;
}
