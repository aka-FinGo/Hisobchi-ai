import { AppData } from './types';

/**
 * START: LOCALSTORAGE BOSHQARUVI
 * Ma'lumotlarni saqlash, yuklash va migratsiya qilish funksiyalari.
 */

const STORAGE_KEY = 'hisobchi_data_v2';

// Boshlang'ich (default) ma'lumotlar
const defaultData: AppData = {
  profile: { name: 'aka_FinGo', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  settings: {
    userName: 'aka_FinGo',
    useBiometrics: false,
    themeColor: '#00d4ff',
    enable3D: true,
    geminiKey: '',
    groqKey: '',
    preferredProvider: 'gemini',
    geminiModel: 'gemini-2.5-flash',
    groqModel: 'groq/compound',
    customPrompt: ''
  },
  wallets: [
    { id: 'w1', name: 'Naqd Pul', type: 'cash', balance: 0, currency: 'UZS', colorTheme: '#00d4ff' },
    { id: 'w2', name: 'Plastik Karta', type: 'card', balance: 0, currency: 'UZS', colorTheme: '#bb86fc' }
  ],
  transactions: [],
  categories: [
    { id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense' },
    { id: 'c2', name: 'Transport', icon: 'Car', type: 'expense' },
    { id: 'c3', name: 'Maosh', icon: 'Briefcase', type: 'income' }
  ]
};

// Funksiya: Ma'lumotlarni yuklash (Load)
export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultData;
    
    const parsed = JSON.parse(data);
    
    // --- PIN KOD MIGRATSIYASI (Olib tashlash) ---
    if (parsed.settings) {
      delete (parsed.settings as any).pinCode;
    }
    
    return { 
      ...defaultData, 
      ...parsed, 
      settings: { ...defaultData.settings, ...parsed.settings } 
    };
  } catch (e) {
    console.error("Storage yuklashda xato:", e);
    return defaultData;
  }
};

// Funksiya: Ma'lumotlarni saqlash (Save)
export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage saqlashda xato:", e);
  }
};

/** END OF STORAGE */
