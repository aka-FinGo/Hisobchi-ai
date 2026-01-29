import { AppData } from './types';

/* --- START: STORAGE LOGIC (LOCALSTORAGE) --- */
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
    customPrompt: ''
  },
  wallets: [{ id: 'w1', name: 'Naqd Pul', type: 'cash', balance: 0, currency: 'UZS', colorTheme: '#00d4ff' }],
  transactions: [],
  categories: [{ id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense' }]
};

// Ma'lumotlarni yuklash (GitHub Actions build vaqtida xato bermasligi uchun try-catch ichida)
export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultData;
    const parsed = JSON.parse(data);
    // PIN kodni o'chirish (Migratsiya)
    if (parsed.settings) delete parsed.settings.pinCode;
    return { ...defaultData, ...parsed, settings: { ...defaultData.settings, ...parsed.settings } };
  } catch (e) { return defaultData; }
};

// Ma'lumotlarni saqlash
export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
/* --- END OF STORAGE --- */
