import { AppData } from './types';

const STORAGE_KEY = 'hisobchi_data_v2';

const defaultData: AppData = {
  profile: { name: 'Foydalanuvchi', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  settings: {
    userName: 'Foydalanuvchi',
    pinCode: null,
    useBiometrics: false,
    themeColor: '#00d4ff',
    enable3D: true,
    aiProvider: 'gemini' // DEFAULT
  },
  wallets: [{ id: 'w1', name: 'Naqd Pul', type: 'cash', balance: 0, currency: 'UZS' }],
  transactions: [],
  categories: [
    { id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', subs: [] },
    { id: 'c2', name: 'Transport', icon: 'Car', type: 'expense', subs: [] },
    { id: 'c3', name: 'Maosh', icon: 'Briefcase', type: 'income', subs: [] }
  ]
};

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!parsed.settings) parsed.settings = defaultData.settings;
      if (!parsed.settings.aiProvider) parsed.settings.aiProvider = 'gemini'; // Eskilar uchun
      if (!parsed.wallets || parsed.wallets.length === 0) parsed.wallets = defaultData.wallets;
      if (!parsed.transactions) parsed.transactions = [];
      return parsed as AppData;
    }
  } catch (e) { console.error(e); }
  return defaultData;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
