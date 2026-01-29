/* --- APP SETTINGS STRUKTURASI --- */
export interface AppSettings {
  userName: string;
  // pinCode olib tashlandi
  useBiometrics: boolean;
  themeColor: string;
  enable3D: boolean;
  geminiKey?: string;
  groqKey?: string;
  preferredProvider: 'gemini' | 'groq';
  customPrompt?: string;
  geminiModel: string; 
  groqModel: string;
}
/* --- END OF TYPES --- */
