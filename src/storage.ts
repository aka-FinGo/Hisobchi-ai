import { AppData } from './types';

// Kalitni o'zgartirdik (v2), lekin eski ma'lumotlarni o'qish uchun mantiq qo'shamiz
const STORAGE_KEY = 'hisobchi_data_v2';

// Boshlang'ich (Default) holat
const defaultData: AppData = {
  profile: {
    name: 'Foydalanuvchi',
    avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  },
  // YANGI: Sozlamalar
  settings: {
    userName: 'Foydalanuvchi',
    pinCode: null,         // Boshida parol yo'q
    useBiometrics: false,
    themeColor: '#00d4ff', // Default Neon Blue
    enable3D: true         // 3D effektlar yoqiq
  },
  wallets: [
    { 
      id: 'w_default', 
      name: 'Naqd Pul', 
      type: 'cash', 
      balance: 0, 
      currency: 'UZS',
      colorTheme: '#00d4ff'
    },
    { 
      id: 'w_card', 
      name: 'Plastik Karta', 
      type: 'card', 
      balance: 0, 
      currency: 'UZS',
      colorTheme: '#bb86fc'
    }
  ],
  transactions: [],
  categories: [
    { id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', subs: [] },
    { id: 'c2', name: 'Transport', icon: 'Car', type: 'expense', subs: [] },
    { id: 'c3', name: 'Uy-ro\'zg\'or', icon: 'Home', type: 'expense', subs: [] },
    { id: 'c4', name: 'Kiyim-kechak', icon: 'Shirt', type: 'expense', subs: [] },
    { id: 'c5', name: 'Sog\'liq', icon: 'HeartPulse', type: 'expense', subs: [] },
    { id: 'c6', name: 'Maosh', icon: 'Briefcase', type: 'income', subs: [] },
    { id: 'c7', name: 'Bonus', icon: 'Gift', type: 'income', subs: [] }
  ]
};

// Ma'lumotlarni yuklash
export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);

      // --- MIGRATION (Eski ma'lumotlarni yangilash) ---
      
      // 1. Agar settings bo'limi yo'q bo'lsa (eski versiyadan o'tganda)
      if (!parsed.settings) {
        parsed.settings = defaultData.settings;
      }

      // 2. Agar wallets bo'limi bo'sh bo'lsa yoki yo'q bo'lsa
      if (!parsed.wallets || parsed.wallets.length === 0) {
        parsed.wallets = defaultData.wallets;
      }
      
      // 3. Agar transactions yo'q bo'lsa
      if (!parsed.transactions) {
        parsed.transactions = [];
      }

      return parsed as AppData;
    }
  } catch (e) {
    console.error("Ma'lumotlarni yuklashda xatolik:", e);
  }
  
  // Agar hech narsa bo'lmasa yoki xato bo'lsa, defaultni qaytaramiz
  return defaultData;
};

// Ma'lumotlarni saqlash
export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Ma'lumotlarni saqlashda xatolik:", e);
  }
};
