/* --- DEFAULT DATA VA MIGRATSIYA --- */
const defaultData: AppData = {
  profile: { name: 'Foydalanuvchi', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
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
  categories: [{ id: 'c1', name: 'Oziq-ovqat', icon: 'ShoppingCart', type: 'expense', subs: [] }]
};
/* --- END OF STORAGE --- */
