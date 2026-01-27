import { AppData, Category, Wallet } from './types';

const STORAGE_KEY = 'hisobchi_pro_hud_v1';

// Boshlang'ich Kategoriyalar
const defaultCategories: Category[] = [
  { 
    id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', 
    subs: [{ id: 's1', name: 'Bozorlik', items: [{id: 'i1', name: 'Go\'sht'}] }] 
  },
  { 
    id: 'c2', name: 'Transport', icon: 'Car', type: 'expense', subs: [] 
  },
  { 
    id: 'c3', name: 'Maosh', icon: 'Briefcase', type: 'income', subs: [] 
  },
];

// Boshlang'ich Hamyonlar
const defaultWallets: Wallet[] = [
  { id: 'w1', name: 'Hamyon (Naqd)', type: 'cash', balance: 500000, currency: 'UZS', colorTheme: 'blue' },
  { id: 'w2', name: 'Visa Karta', type: 'dollar', balance: 100, currency: 'USD', colorTheme: 'green' },
];

const defaultData: AppData = {
  profile: { name: 'Foydalanuvchi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FinGo' },
  wallets: defaultWallets,
  transactions: [],
  categories: defaultCategories,
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultData;
  } catch { return defaultData; }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
