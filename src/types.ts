// 1. O'tkazma turlari
export type TransactionType = 'income' | 'expense' | 'transfer';

// 2. Kategoriya Ierarxiyasi
export interface ChildCategory {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;
  items?: ChildCategory[];
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon nomi (string sifatida)
  type: TransactionType;
  subs?: SubCategory[];
}

// 3. Hamyon
export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank' | 'dollar';
  balance: number;
  currency: 'UZS' | 'USD';
  colorTheme?: string; // Hamyonning o'z rangi (ixtiyoriy)
}

// 4. Tranzaksiya (Amal)
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  walletId: string;
  categoryId: string;
  subCategoryId?: string; // Ixtiyoriy
  childCategoryId?: string; // Ixtiyoriy
  date: string; // ISO format (YYYY-MM-DD)
  note?: string; // Izoh yoki Lokatsiya manzili shu yerda saqlanadi
  exchangeRate?: number; // Agar USD bo'lsa kurs
}

// 5. Profil va Sozlamalar (YANGI)
export interface AppSettings {
  userName: string;
  pinCode: string | null; // Null bo'lsa, parol yo'q
  useBiometrics: boolean; // Barmoq izi (kelajak uchun)
  themeColor: string; // Dastur asosiy rangi (masalan: #00d4ff)
  enable3D: boolean; // 3D effektlarni yoqish/o'chirish
}

export interface AppProfile {
  name: string;
  avatar: string;
}

// 6. Dasturning Umumiy Ma'lumotlari (Global State)
export interface AppData {
  profile: AppProfile;
  settings: AppSettings; // Sozlamalar qo'shildi
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
}

// 7. Filterlash Holati
export interface FilterState {
  walletId?: string;
  categoryId?: string;
  subCategoryId?: string;
  childCategoryId?: string;
  location?: string; // Lokatsiya bo'yicha qidiruv
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
}
