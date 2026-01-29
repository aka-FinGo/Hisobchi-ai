import { AppData } from './types';

const STORAGE_KEY = 'hisobchi_data_v2';

const defaultData: AppData = {
  profile: { 
    name: 'Foydalanuvchi', 
    avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
  },
  settings: {
    userName: 'Foydalanuvchi',
    pinCode: null,
    useBiometrics: false,
    themeColor: '#00d4ff',
    enable3D: true,
    
    // AI Default Sozlamalari
    geminiKey: '',
    groqKey: '',
    preferredProvider: 'gemini', // Default: Gemini
    aiModel: 'gemini-2.5-flash', // Default: Eng yangi model
    customPrompt: ''
  },
  wallets: [
    { id: 'w1', name: 'Naqd Pul', type: 'cash', balance: 0, currency: 'UZS', colorTheme: '#00d4ff' },
    { id: 'w2', name: 'Plastik Karta', type: 'card', balance: 0, currency: 'UZS', colorTheme: '#bb86fc' }
  ],
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
      
      // --- MIGRATION (Eski ma'lumotlarni to'g'irlash) ---
      if (!parsed.settings) parsed.settings = defaultData.settings;
      
      // Agar eski aiApiKey bo'lsa, uni geminiKey ga o'tkazamiz
      if (parsed.settings.aiApiKey && !parsed.settings.geminiKey) {
          parsed.settings.geminiKey = parsed.settings.aiApiKey;
      }
      
      // Yangi polya: preferredProvider
      if (!parsed.settings.preferredProvider) {
          parsed.settings.preferredProvider = 'gemini';
      }

      // Yangi polya: aiModel
      if (!parsed.settings.aiModel) {
          parsed.settings.aiModel = 'gemini-2.5-flash';
      }

      if (!parsed.wallets || parsed.wallets.length === 0) parsed.wallets = defaultData.wallets;
      if (!parsed.transactions) parsed.transactions = [];
      
      return parsed as AppData;
    }
  } catch (e) {
    console.error("Storage Error:", e);
  }
  return defaultData;
};

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Save Error:", e);
  }
};
