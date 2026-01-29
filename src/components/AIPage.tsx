import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, Wallet, History } from 'lucide-react';
import { AppData, Transaction } from '../types';

interface Props { data: AppData; onAddTransaction: (tx: Transaction) => void; }
interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; actionResult?: any; }

export default function AIPage({ data, onAddTransaction }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', role: 'assistant', content: `Salom, ${data.profile.name}! Moliyaviy yordamchingiz tayyor.` }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // --- 1. CONTEXT TAYYORLASH (AI sizning holatingizni ko'rishi uchun) ---
  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    // Statistika
    const income = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    
    // Oxirgi 10 ta operatsiya (AI "bo'm-bo'sh" demasligi uchun)
    const recentTx = data.transactions.slice(0, 10).map(t => 
        `- ${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount} (${data.categories.find(c => c.id === t.categoryId)?.name}) - ${t.note || ''}`
    ).join('\n');

    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');

    return `
      Sen professional moliyaviy yordamchisan. Bugun: ${today.toISOString().split('T')[0]}.
      
      FOYDALANUVCHI HOLATI:
      - Bu oy kirim: ${income}
      - Bu oy chiqim: ${expense}
      - Hamyonlar: ${walletList}
      - Kategoriyalar: ${catList}
      
      OXIRGI AMALLAR TARIXI:
      ${recentTx || "Hozircha amallar yo'q."}

      FOYDALANUVCHI SOZLAMASI (Prompt):
      ${data.settings.customPrompt || "Qo'shimcha yo'riqnoma yo'q."}

      QAT'IY QOIDALAR:
      1. AGAR foydalanuvchi yangi xarajat/kirim qo'shsa -> JSON formatda qaytar:
         {"action": "add", "amount": 1000, "type": "expense", "category": "...", "wallet": "...", "date": "YYYY-MM-DD", "note": "..."}
      
      2. AGAR foydalanuvchi tarixni qidirsa -> JSON formatda qaytar:
         {"action": "search", "query": "..."}
      
      3. AGAR foydalanuvchi "Ahvolim qanday?", "Maslahat ber" yoki oddiy gapirsa -> ODDIY MATN (Text) qaytar. Zinhor JSON ishlatma.

      Javobingda hech qachon "JSON:" yoki "```json" deb yozma, faqat toza kod yoki toza matn bo'lsin.
    `;
  };

  // --- 2. AI CAll ---
  const callAIProvider = async (provider: string, key: string, prompt: string, userMsg: string) => {
      // (Bu qism o'zgarishsiz, oldingi kod bilan bir xil)
      if (provider === 'gemini') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt + `\n\nUser: ${userMsg}` }] }] })
          });
          const json = await res.json();
          return json.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (provider === 'groq') {
          const res = await fetch('[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)', {
              method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "system", content: prompt }, { role: "user", content: userMsg }] })
          });
          const json = await res.json();
          return json.choices?.[0]?.message?.content;
      }
      throw new Error("Unknown provider");
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const systemPrompt = getSystemContext(userMsg.content);
        
        // Provayder tanlash logikasi (o'sha-o'sha)
        const preferred = data.settings.preferredProvider;
        const providers = [];
        if (preferred === 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred === 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });
        // Fallback
        if (preferred !== 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred !== 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });

        let aiText = "";
        let success = false;
        
        for (const p of providers) {
            try {
                aiText = await callAIProvider(p.name, p.key, systemPrompt, userMsg.content) || "";
                success = true;
                break;
            } catch (e) { console.error(e); }
        }

        if (!success) throw new Error("API Xatolik");

        // --- YANGI: JAVOBNI TEKSHIRISH ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: aiText };
        
        // JSON tozalash (ba'zan AI ```json ichida beradi)
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
            try {
                const actionData = JSON.parse(cleanJson);
                
                if (actionData.action === 'add') {
                     const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(actionData.category.toLowerCase())) || data.categories[0];
                     const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(actionData.wallet?.toLowerCase())) || data.wallets[0];
                     const newTx = { id: Date.now().toString(), amount: parseFloat(actionData.amount), type: actionData.type, walletId: matchedWallet.id, categoryId: matchedCat.id, date: actionData.date || new Date().toISOString().split('T')[0], note: actionData.note || 'AI' };
                     
                     onAddTransaction(newTx);
                     processedMsg.content = `✅ ${newTx.amount.toLocaleString()} so'm qo'shildi.`; // Foydalanuvchiga JSON emas, chiroyli tekst ko'rsatamiz
                     processedMsg.actionResult = { type: 'success', tx: newTx };
                } 
                else if (actionData.action === 'search') {
                     const query = actionData.query.toLowerCase();
                     const results = data.transactions.filter(t => t.note?.toLowerCase().includes(query) || data.categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)).slice(0,5);
                     processedMsg.content = `🔎 "${query}" bo'yicha qidiruv natijalari:`; // JSON o'rniga tekst
                     processedMsg.actionResult = { type: 'search', items: results };
                }
            } catch (e) {
                // Agar JSON buzilgan bo'lsa, shunchaki matnni chiqaradi
            }
        }
        
        setMessages(prev => [...prev, processedMsg]);

    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Xatolik: API kalitlarni tekshiring." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="text-[#bb86fc]" size={20}/> AI Yordamchi</h2></div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>{msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}</div>
                  <div className={`max-w-[80%] space-y-2`}>
                      {/* Faqat JSON bo'lmagan qismini ko'rsatamiz */}
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>{msg.content}</div>
                      
                      {msg.actionResult?.type === 'success' && (<div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3 animate-slideUp"><CheckCircle className="text-[#107c41]" size={20}/><div><p className="text-white text-xs font-bold">Saqlandi</p><p className="text-gray-400 text-[10px]">{msg.actionResult.tx.amount.toLocaleString()} | {msg.actionResult.tx.note}</p></div></div>)}
                      {msg.actionResult?.type === 'search' && (<div className="space-y-2 animate-slideUp">{msg.actionResult.items.map((t: any) => (<div key={t.id} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center"><span className="text-gray-400 text-xs">{t.date}</span><span className="text-white text-xs font-bold">{t.amount.toLocaleString()}</span></div>))}{msg.actionResult.items.length === 0 && <p className="text-gray-500 text-xs italic">Hech narsa topilmadi.</p>}</div>)}
                  </div>
              </div>
          ))}
          {loading && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[#0a0e17]"/></div><div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs italic">O'ylayapman...</div></div>)}
      </div>

      <div className="p-4 bg-[#0a0e17] border-t border-white/5"><div className="relative"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Savol bering yoki xarajat yozing..." className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm"/><button onClick={handleSend} disabled={loading || !input.trim()} className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform"><Send size={18} fill="#0a0e17"/></button></div></div>
    </div>
  );
import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { NativeBiometric } from '@capgo/capacitor-native-biometric'; // PLAGINNI O'RNATISH KERAK
import { Home, BarChart2, Plus, Sparkles, User, Lock, Shield, Fingerprint, Key, Camera, Server, Save, CheckCircle, FileText } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

// ... (Boshqa importlar: HomePage, Modallar...)
import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

// --- PROFIL SAHIFASI ---
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    const [name, setName] = useState(data.settings.userName || '');
    const [pin, setPin] = useState(data.settings.pinCode || '');
    const [biometrics, setBiometrics] = useState(data.settings.useBiometrics || false);
    
    // AI STATE
    const [geminiKey, setGeminiKey] = useState(data.settings.geminiKey || '');
    const [groqKey, setGroqKey] = useState(data.settings.groqKey || '');
    const [preferred, setPreferred] = useState(data.settings.preferredProvider || 'gemini');
    const [customPrompt, setCustomPrompt] = useState(data.settings.customPrompt || '');
    
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        onUpdateSettings({
            ...data.settings,
            userName: name,
            pinCode: pin || null,
            useBiometrics: biometrics,
            geminiKey,
            groqKey,
            preferredProvider: preferred,
            customPrompt
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0e17] animate-slideUp">
            <div className="p-6 pt-10 pb-4 shrink-0 bg-[#0a0e17] z-10 sticky top-0">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><User className="text-[#00d4ff]"/> Profil</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-32 scroll-area">
                {/* 1. AVATAR (O'zgarishsiz) */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-4">
                        <img src={data.profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#141e3c] shadow-2xl object-cover"/>
                        <button className="absolute bottom-0 right-0 p-2 bg-[#00d4ff] rounded-full text-[#0a0e17] shadow-lg active:scale-95"><Camera size={16}/></button>
                    </div>
                    <input value={name} onChange={e => setName(e.target.value)} className="bg-transparent text-center text-xl font-bold text-white outline-none border-b border-transparent focus:border-[#00d4ff] pb-1 w-2/3" placeholder="Ismingiz"/>
                </div>

                {/* 2. AI SOZLAMALARI */}
                <div className="mb-6">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">AI Sozlamalari</h3>
                    <div className="bg-[#141e3c] p-4 rounded-2xl border border-white/5 space-y-5">
                        {/* Provayder */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><Server size={14} className="text-[#00ff9d]"/> Asosiy AI</p>
                            <div className="flex bg-[#0a0e17] rounded-xl p-1 border border-white/10">
                                <button onClick={() => setPreferred('gemini')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${preferred === 'gemini' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}>Gemini</button>
                                <button onClick={() => setPreferred('groq')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${preferred === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>Groq</button>
                            </div>
                        </div>
                        {/* Kalitlar */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 text-[#00d4ff]">Gemini Key</p>
                            <input type="text" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 focus:border-[#00d4ff] text-xs font-mono"/>
                        </div>
                        <div>
                            <p className="text-white text-xs font-bold mb-2 text-[#f55036]">Groq Key</p>
                            <input type="text" value={groqKey} onChange={e => setGroqKey(e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 focus:border-[#f55036] text-xs font-mono"/>
                        </div>
                        {/* YANGI: Custom Prompt */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><FileText size={14} className="text-yellow-500"/> Qo'shimcha Buyruq (Prompt)</p>
                            <textarea rows={3} placeholder="Masalan: Meni sen bilan qattiqqo'l bo'l, ortiqcha pul ishlatishga qo'yma..." value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 focus:border-yellow-500 text-xs resize-none"/>
                        </div>
                    </div>
                </div>

                {/* 3. XAVFSIZLIK */}
                <div className="mb-6">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Xavfsizlik</h3>
                    <div className="bg-[#141e3c] rounded-2xl overflow-hidden border border-white/5">
                        {/* PIN */}
                        <div className="p-4 border-b border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg"><Lock size={18} className="text-[#00d4ff]"/></div><span className="text-white text-sm font-bold">PIN Kod</span></div>
                                <div className="relative inline-block w-10 h-6 align-middle select-none"><input type="checkbox" checked={!!pin} onChange={() => { if(pin) setPin(''); else setPin('0000'); }} className="hidden"/><div className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${pin ? 'bg-[#00d4ff]' : 'bg-gray-600'}`} onClick={() => { if(pin) setPin(''); else setPin('0000'); }}></div><div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${pin ? 'left-5' : 'left-1'}`}></div></div>
                            </div>
                            {pin && (<input type="number" placeholder="PIN (4 ta)" value={pin} onChange={e => { const val = e.target.value; if(val.length <= 4) setPin(val); }} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl text-center tracking-[8px] font-mono outline-none border border-white/10 focus:border-[#00d4ff]"/>)}
                        </div>
                        {/* Barmoq Izi */}
                        <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg"><Fingerprint size={18} className="text-[#ff3366]"/></div><span className="text-white text-sm font-bold">Barmoq izi</span></div>
                            <button onClick={() => setBiometrics(!biometrics)} className={`w-10 h-6 rounded-full relative transition-colors ${biometrics ? 'bg-[#ff3366]' : 'bg-gray-600'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${biometrics ? 'left-5' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-lg mb-10 ${isSaved ? 'bg-[#107c41] text-white' : 'bg-[#00d4ff] text-[#0a0e17]'}`}>
                    {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>} {isSaved ? "SAQLANDI" : "SOZLAMALARNI SAQLASH"}
                </button>
            </div>
        </div>
    )
}

// --- YANGILANGAN LOCK SCREEN (Biometrik bilan) ---
const LockScreen = ({ correctPin, useBiometrics, onUnlock }: { correctPin: string, useBiometrics: boolean, onUnlock: () => void }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    // Barmoq izini tekshirish
    const checkBiometric = async () => {
        if (!useBiometrics) return;
        try {
            const result = await NativeBiometric.isAvailable();
            if (result.isAvailable) {
                await NativeBiometric.verifyIdentity({
                    reason: "Ilovaga kirish uchun barmoq izini tasdiqlang",
                    title: "Kirish",
                    subtitle: "Barmoq izi yoki FaceID",
                    description: "Hisobchi AI ga kirish"
                });
                onUnlock(); // Muvaffaqiyatli
            }
        } catch (e) {
            console.log("Biometrik xatolik yoki bekor qilindi", e);
            // Xato bo'lsa hech narsa qilmaymiz, foydalanuvchi PIN teradi
        }
    };

    // Sahifa ochilishi bilan barmoq izini so'raymiz
    useEffect(() => {
        checkBiometric();
    }, []);

    const handleInput = (val: string) => {
        const newVal = input + val;
        setInput(newVal);
        if (newVal.length === correctPin.length) {
            // String qilib solishtiramiz
            if (String(newVal) === String(correctPin)) {
                onUnlock();
            } else {
                setError(true);
                setTimeout(() => { setInput(''); setError(false); }, 500);
            }
        }
    }

    return (
        <div className="fixed inset-0 z-[300] bg-[#05070a] flex flex-col items-center justify-center animate-slideUp">
            <div className="p-4 bg-[#141e3c] rounded-full mb-8" onClick={checkBiometric}><Lock size={32} className="text-[#00d4ff]"/></div>
            <h2 className="text-white font-bold text-xl mb-8">Parolni kiriting</h2>
            
            {/* PIN Dots */}
            <div className="flex gap-4 mb-10">
                {[...Array(correctPin.length)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border border-[#00d4ff] ${i < input.length ? 'bg-[#00d4ff]' : ''} ${error ? 'animate-bounce bg-red-500 border-red-500' : ''}`}></div>
                ))}
            </div>

            {/* Keyboard */}
            <div className="grid grid-cols-3 gap-6">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                    <button key={n} onClick={() => handleInput(n.toString())} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl active:scale-90">{n}</button>
                ))}
                <div/>
                <button onClick={() => handleInput('0')} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl active:scale-90">0</button>
                <button onClick={() => setInput(input.slice(0,-1))} className="w-16 h-16 rounded-full text-gray-500 flex items-center justify-center active:scale-90">⬅️</button>
            </div>

            {useBiometrics && (
                <button onClick={checkBiometric} className="mt-8 text-[#00d4ff] text-sm font-bold flex items-center gap-2">
                    <Fingerprint size={20}/> Barmoq izi bilan kirish
                </button>
            )}
        </div>
    )
}

// ... (App komponenti va boshqa logika o'zgarishsiz)
// Eslatma: App komponentida LockScreen chaqirilganda useBiometrics ni ham berib yuborish kerak:

function App() {
  const [data, setData] = useState<AppData>(loadData());
  // ... (Boshqa state'lar)
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'ai' | 'profile'>('home');
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  
  // Qulflash logikasi
  const [isLocked, setIsLocked] = useState(!!(data.settings?.pinCode && data.settings.pinCode.length === 4));
  
  // ... (Effektlar va handlerlar o'zgarishsiz)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  const [statsFilter, setStatsFilter] = useState<FilterState | null>(null);
  
  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { CapacitorApp.addListener('backButton', () => { if(!isLocked) { if(isTxModalOpen||isWalletModalOpen||detailTx||contextMenu){ setIsTxModalOpen(false); setIsWalletModalOpen(false); setDetailTx(null); setContextMenu(null); } else if(historyStack.length>0){ setHistoryStack(p=>p.slice(0,-1)); setActiveTab(historyStack[historyStack.length-1]); } else if(activeTab!=='home'){ setActiveTab('home'); } else { CapacitorApp.exitApp(); } } }); }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab, isLocked]);

  const refreshData = () => { setData(loadData()); };
  const handleWalletSave = (wallet: Wallet) => { if (editingWallet) setData({ ...data, wallets: data.wallets.map(w => w.id === wallet.id ? wallet : w) }); else setData({ ...data, wallets: [...data.wallets, wallet] }); setIsWalletModalOpen(false); setEditingWallet(null); };
  const handleTransactionSave = (txData: Transaction) => { let newTx = [...data.transactions]; let newW = [...data.wallets]; if (editingTx) { const old = data.transactions.find(t => t.id === editingTx.id); if(old) { newW = newW.map(w => w.id === old.walletId ? { ...w, balance: w.balance + (old.type === 'income' ? -old.amount : old.amount) } : w); newTx = newTx.filter(t => t.id !== editingTx.id); } } const finalTx = { ...txData, id: txData.id || Date.now().toString() }; newTx.push(finalTx); newW = newW.map(w => w.id === finalTx.walletId ? { ...w, balance: w.balance + (finalTx.type === 'income' ? finalTx.amount : -finalTx.amount) } : w); setData({ ...data, transactions: newTx, wallets: newW }); setIsTxModalOpen(false); setEditingTx(null); setDetailTx(null); };
  const handleDeleteTx = (id: string) => { if(!confirm("O'chirilsinmi?")) return; const tx = data.transactions.find(t => t.id === id); if(!tx) return; const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w); setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newW }); setContextMenu(null); setDetailTx(null); };
  const handleDeleteWallet = (id: string) => { if(!confirm("Hamyon o'chirilsinmi?")) return; setData({ ...data, wallets: data.wallets.filter(w => w.id !== id), transactions: data.transactions.filter(t => t.walletId !== id) }); setContextMenu(null); };
  const handleJumpToFilter = (filter: FilterState) => { setStatsFilter(filter); setDetailTx(null); setActiveTab('stats'); };

  // LOCK SCREEN RENDER
  if (isLocked && data.settings?.pinCode) {
      return (
          <LockScreen 
              correctPin={data.settings.pinCode} 
              useBiometrics={data.settings.useBiometrics} 
              onUnlock={() => setIsLocked(false)} 
          />
      );
  }

  // MAIN RENDER (O'zgarishsiz)
  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0e17] font-['Plus_Jakarta_Sans'] select-none text-[#e0e0ff]" onClick={() => setContextMenu(null)}>
      <div className="flex-1 overflow-hidden relative"><div className="h-full w-full">
          {activeTab === 'home' && <HomePage data={data} onNavigate={(p) => { setHistoryStack(prev => [...prev, activeTab]); setActiveTab(p as any); }} onTransactionClick={setDetailTx} onContextMenu={(e, i, t) => setContextMenu({ x: e.clientX, y: e.clientY, item: i, type: t })} onAddWallet={() => { setEditingWallet(null); setIsWalletModalOpen(true); }} onRefresh={refreshData}/>}
          {activeTab === 'stats' && <StatsPage data={data} initialFilter={statsFilter} onClearFilter={() => setStatsFilter(null)} onTxClick={setDetailTx} />}
          {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />}
          {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={(s) => setData({...data, settings: s})} />}
      </div></div>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl pb-5 pt-3 border-t border-white/5"><div className="flex justify-between items-center px-6"><button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Home size={24}/></button><button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><BarChart2 size={24}/></button><div className="relative -top-7"><button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/40 text-[#00d4ff] flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.3)] active:scale-95 transition-transform"><Plus size={32} strokeWidth={3} /></button></div><button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><User size={24}/></button><button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Sparkles size={24}/></button></div></div>
      <WalletModal isOpen={isWalletModalOpen} onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }} onSave={handleWalletSave} initialData={editingWallet} />
      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSave={handleTransactionSave} categories={data.categories} wallets={data.wallets} allTransactions={data.transactions} initialData={editingTx} onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} onUpdateCategories={(u) => setData({...data, categories: u})} settings={data.settings}/>
      <TransactionDetailModal isOpen={!!detailTx} onClose={() => setDetailTx(null)} transaction={detailTx} category={data.categories.find(c => c.id === detailTx?.categoryId)} wallet={data.wallets.find(w => w.id === detailTx?.walletId)} onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }} onDelete={handleDeleteTx} onFilter={handleJumpToFilter} />
      {contextMenu && (<div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}><button onClick={() => { if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); } if(contextMenu.type === 'wallet') { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } setContextMenu(null); }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">✏️ Tahrirlash</button><div className="h-[1px] bg-white/5 my-1"></div><button onClick={() => { if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); else handleDeleteWallet(contextMenu.item.id); }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">🗑️ O'chirish</button></div>)}
    </div>
  );
}
export default App;
}
