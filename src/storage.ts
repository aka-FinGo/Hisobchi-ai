import { AppData, Category, Wallet } from './types';

// Baza kalitini yangilaymiz: 'cyber_v1'
const STORAGE_KEY = 'hisobchi_cyber_v1';

const defaultCategories: Category[] = [
  { id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', subCategories: ['Bozor', 'Kafe', 'Shirinliklar'] },
  { id: 'c2', name: 'Transport', icon: 'Car', type: 'expense', subCategories: ['Taksi', 'Benzin', 'Avtobus'] },
  { id: 'c3', name: 'Uy-joy', icon: 'Home', type: 'expense', subCategories: ['Kommunal', 'Ijara'] },
  { id: 'c9', name: 'Daromad', icon: 'Briefcase', type: 'income', subCategories: ['Ish haqi', 'Bonus', 'Freelance'] },
];

const defaultWallets: Wallet[] = [
  { id: 'w1', name: 'Asosiy Hamyon', type: 'card', balance: 0, currency: 'UZS', colorTheme: 'from-blue-600 to-indigo-600' },
  { id: 'w2', name: 'Naqd Pul', type: 'cash', balance: 0, currency: 'UZS', colorTheme: 'from-emerald-500 to-teal-600' },
];

const defaultData: AppData = {
  profile: {
    name: 'Foydalanuvchi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    currency: 'UZS',
    theme: 'cyber'
  },
  wallets: defaultWallets,
  transactions: [],
  categories: defaultCategories,
  budgets: [],
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
      const parsed = JSON.parse(stored);
      // Agar bazada profile yoki boshqa qismlar bo'lmasa, default'dan olamiz
      return {
        ...defaultData,
        ...parsed,
        profile: parsed.profile || defaultData.profile,
        budgets: parsed.budgets || defaultData.budgets,
        aiSettings: parsed.aiSettings || defaultData.aiSettings
      };
    }
  } catch (error) {
    console.error('Data load error:', error);
  }
  return defaultData;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Data save error:', error);
  }
};
