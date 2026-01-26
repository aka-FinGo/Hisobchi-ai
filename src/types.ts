export type TransactionType = 'income' | 'expense';
export type Currency = 'UZS' | 'USD';

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'dollar';
  balance: number;
  currency: Currency;
  colorTheme?: string; // Kartaning rangi uchun
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon nomi
  type: TransactionType;
  subCategories?: string[]; // YANGI: Podkategoriyalar ro'yxati
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  subCategory?: string; // Agar tanlangan bo'lsa
  walletId: string;
  type: TransactionType;
  date: string;
  note?: string;
}

export interface AISettings {
  provider: 'gemini' | 'groq' | 'openai';
  apiKey: string;
  model: string;
  tokensUsed: number;
  tokenLimit: number;
}

export interface AppData {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  aiSettings: AISettings;
}
