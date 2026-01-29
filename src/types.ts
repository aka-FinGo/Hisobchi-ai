/**
 * START: LOYIHA TURLARI (INTERFACES)
 * Barcha ma'lumotlar strukturasi shu yerda belgilanadi.
 */

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category { 
  id: string; 
  name: string; 
  icon: string; 
  type: TransactionType; 
  subs?: { id: string; name: string; items?: { id: string; name: string; }[] }[]; 
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
  date: string; 
  note?: string;
}

export interface AppSettings {
  userName: string;
  useBiometrics: boolean; // Faqat biometrika qoldi
  themeColor: string;
  enable3D: boolean;
  geminiKey?: string;
  groqKey?: string;
  preferredProvider: 'gemini' | 'groq';
  geminiModel: string; 
  groqModel: string;
  customPrompt?: string;
}

export interface AppData {
  profile: { name: string; avatar: string; };
  settings: AppSettings;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
}

/** END OF TYPES */
