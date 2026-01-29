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
  pinCode: string | null;
  useBiometrics: boolean;
  themeColor: string;
  enable3D: boolean;
  
  // API Kalitlar
  geminiKey?: string;
  groqKey?: string;
  
  // Model tanlash
  preferredProvider: 'gemini' | 'groq';
  
  // Model nomlari (String qilib qo'ydim, chunki ro'yxat juda uzun va o'zgaruvchan)
  customPrompt?: string;
  geminiModel: string; 
  groqModel: string;
}

export interface AppProfile { name: string; avatar: string; }

export interface AppData {
  profile: AppProfile; settings: AppSettings; wallets: Wallet[]; transactions: Transaction[]; categories: Category[];
}

export interface FilterState {
  walletId?: string; categoryId?: string; subCategoryId?: string; childCategoryId?: string; location?: string; startDate?: string; endDate?: string; type?: TransactionType | 'all';
}
