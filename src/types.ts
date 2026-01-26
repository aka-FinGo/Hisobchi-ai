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

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  subCategories?: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  subCategory?: string;
  walletId: string;
  type: TransactionType;
  date: string;
  note?: string;
}

export interface Budget {
  categoryId: string;
  limit: number;
  spent: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  currency: Currency;
  theme: 'cyber' | 'glass';
}

export interface AISettings {
  provider: 'gemini' | 'groq' | 'openai';
  apiKey: string;
  model: string;
  tokensUsed: number;
  tokenLimit: number;
}

export interface AppData {
  profile: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  aiSettings: AISettings;
}
