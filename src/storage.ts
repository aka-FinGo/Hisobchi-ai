import { AppData, Category, Wallet } from './types';

const STORAGE_KEY = 'finance_app_data';

const defaultCategories: Category[] = [
  { id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense' },
  { id: 'c2', name: 'Transport', icon: 'Car', type: 'expense' },
  { id: 'c3', name: 'Uy-joy', icon: 'Home', type: 'expense' },
  { id: 'c4', name: 'Salomatlik', icon: 'Heart', type: 'expense' },
  { id: 'c5', name: 'O\'yin-kulgi', icon: 'Gamepad2', type: 'expense' },
  { id: 'c6', name: 'Kiyim-kechak', icon: 'ShoppingBag', type: 'expense' },
  { id: 'c7', name: 'Ta\'lim', icon: 'BookOpen', type: 'expense' },
  { id: 'c8', name: 'Boshqa', icon: 'MoreHorizontal', type: 'expense' },
  { id: 'c9', name: 'Ish haqi', icon: 'Briefcase', type: 'income' },
  { id: 'c10', name: 'Biznes', icon: 'TrendingUp', type: 'income' },
  { id: 'c11', name: 'Sovg\'a', icon: 'Gift', type: 'income' },
  { id: 'c12', name: 'Boshqa daromad', icon: 'DollarSign', type: 'income' },
];

const defaultWallets: Wallet[] = [
  { id: 'w1', name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS' },
  { id: 'w2', name: 'Plastik karta', type: 'card', balance: 0, currency: 'UZS' },
  { id: 'w3', name: 'Dollar', type: 'dollar', balance: 0, currency: 'USD' },
];

const defaultData: AppData = {
  wallets: defaultWallets,
  transactions: [],
  categories: defaultCategories,
  settings: {
    apiKey: '',
  },
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return defaultData;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString) as AppData;
    saveData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
