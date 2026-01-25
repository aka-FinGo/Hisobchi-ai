// src/storage.ts
import { AppData, Category, Wallet } from './types';

const STORAGE_KEY = 'finance_app_data_v2'; // Versiyani o'zgartirdim, toza start uchun

const defaultCategories: Category[] = [
  // Xarajatlar
  { id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', subCategories: ['Bozorlik', 'Tushlik', 'Fast Food', 'Suv'] },
  { id: 'c2', name: 'Transport', icon: 'Car', type: 'expense', subCategories: ['Taksi', 'Avtobus', 'Benzin', 'Metan'] },
  { id: 'c3', name: 'Uy-joy', icon: 'Home', type: 'expense', subCategories: ['Kommunal', 'Ijara', 'Ta\'mir'] },
  { id: 'c4', name: 'Salomatlik', icon: 'Heart', type: 'expense', subCategories: ['Dori-darmon', 'Vrach', 'Sport'] },
  { id: 'c5', name: 'O\'yin-kulgi', icon: 'Gamepad2', type: 'expense', subCategories: ['Kino', 'Kafe', 'Hordiq'] },
  { id: 'c6', name: 'Kiyim-kechak', icon: 'ShoppingBag', type: 'expense' },
  { id: 'c7', name: 'Ta\'lim', icon: 'BookOpen', type: 'expense', subCategories: ['Kurslar', 'Kitoblar'] },
  { id: 'c8', name: 'Boshqa', icon: 'MoreHorizontal', type: 'expense' },
  // Kirimlar
  { id: 'c9', name: 'Daromad', icon: 'Briefcase', type: 'income', subCategories: ['Ish haqi', 'Avans', 'Bonus'] },
  { id: 'c10', name: 'Biznes', icon: 'TrendingUp', type: 'income' },
  { id: 'c11', name: 'Sovg\'a', icon: 'Gift', type: 'income' },
  { id: 'c12', name: 'Boshqa kirim', icon: 'DollarSign', type: 'income' },
];

const defaultWallets: Wallet[] = [
  { id: 'w1', name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS', colorTheme: 'from-emerald-500 to-teal-600' },
  { id: 'w2', name: 'Plastik karta', type: 'card', balance: 0, currency: 'UZS', colorTheme: 'from-blue-600 to-purple-600' },
  { id: 'w3', name: 'Dollar', type: 'dollar', balance: 0, currency: 'USD', colorTheme: 'from-orange-500 to-red-500' },
];

const defaultData: AppData = {
  wallets: defaultWallets,
  transactions: [],
  categories: defaultCategories,
  aiSettings: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-flash',
    tokensUsed: 0,
    tokenLimit: 1000000,
  },
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedData = JSON.parse(stored);
      // Oddiy migratsiya: eski ma'lumotlar ustiga yangi struktura qoliplarini qo'yish
      return {
        ...defaultData,
        ...parsedData,
        categories: parsedData.categories || defaultCategories, // Kategoriyalar yo'qolsa tiklash
      };
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
