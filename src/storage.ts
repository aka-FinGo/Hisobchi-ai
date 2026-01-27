import { AppData, Category, Wallet } from './types';

const STORAGE_KEY = 'hisobchi_pro_v3_hierachy'; // Keyni yangiladik

const defaultCategories: Category[] = [
  { 
    id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', 
    subs: [
      { id: 's1', name: 'Bozorlik', items: [{id: 'i1', name: 'Go\'sht'}, {id: 'i2', name: 'Sabzavot'}] }
    ] 
  },
  { 
    id: 'c2', name: 'Daromad', icon: 'Briefcase', type: 'income', 
    subs: [
      { id: 's2', name: 'Ish haqi', items: [{id: 'm1', name: 'Yanvar'}, {id: 'm2', name: 'Fevral'}] },
      { id: 's3', name: 'Zakazlar', items: [{id: 'z1', name: '123_01'}, {id: 'z2', name: '145_01'}] }
    ] 
  },
];

const defaultWallets: Wallet[] = [
  { id: 'w1', name: 'Naqd So\'m', type: 'cash', balance: 0, currency: 'UZS', colorTheme: 'orange' },
  { id: 'w2', name: 'Plastik So\'m', type: 'card', balance: 0, currency: 'UZS', colorTheme: 'blue' },
  { id: 'w3', name: 'Naqd Dollar', type: 'dollar', balance: 0, currency: 'USD', colorTheme: 'green' },
];

const defaultData: AppData = {
  profile: { name: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FinGo' },
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
