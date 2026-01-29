import { AppData } from './types';

/**
 * Ma'lumotlarni saqlash va yuklash xizmati.
 * LocalStorage bilan ishlaydi va default qiymatlarni ta'minlaydi.
 */

const STORAGE_KEY = 'hisobchi_data_v2';

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
    aiModel: 'gemini-2.5-flash',
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

// START: Ma'lumotlarni yuklash funksiyasi
export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // PIN kod o'chirilgani uchun settingsni tozalash
      if (parsed.settings) delete parsed.settings.pinCode;
      return { ...defaultData, ...parsed, settings: { ...defaultData.settings, ...parsed.settings } };
    }
  } catch (e) { console.error("Yuklashda xato:", e); }
  return defaultData;
};
// END: Ma'lumotlarni yuklash funksiyasi

// START: Ma'lumotlarni saqlash funksiyasi
export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.error("Saqlashda xato:", e); }
};
// END: Ma'lumotlarni saqlash funksiyasi
