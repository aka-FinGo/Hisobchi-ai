import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, ListChecks, AlertTriangle, Wallet, History, ExternalLink } from 'lucide-react';
import { AppData, Transaction } from '../types';

interface Props {
  data: AppData;
  onAddTransaction: (tx: Transaction) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actionResult?: any;
}

export default function AIPage({ data, onAddTransaction }: Props) {
  const [input, setInput] = useState('');
  
  // 1. Boshlang'ich xabar
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: `Salom, ${data.profile.name}! \n\nMen sizning moliyaviy yordamchingizman. Menga:\n- "Tushlik 50k, Taksi 20k" deb ro'yxat tashlashingiz,\n- "Qancha pulim qoldi?" deb so'rashingiz mumkin.` 
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Kalit borligini tekshirish
  const hasKey = !!(data.settings.geminiKey || data.settings.groqKey);

  // Avtomatik pastga tushish
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- 2. AQLLI PATTERN (Context Learning) ---
  // Bu funksiya foydalanuvchi odatlarini tarixidan qidiradi
  const findSmartPatterns = (userInput: string): string => {
      // So'zlarni ajratib olamiz (3 harfdan uzunlari)
      const words = userInput.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
      const hints: string[] = [];
      
      words.forEach(word => {
          // Tarixdan shu so'z qatnashgan oxirgi 5 ta amalni ko'rib chiqamiz
          const match = data.transactions.find(t => t.note?.toLowerCase().includes(word));
          
          if (match) {
              const catName = data.categories.find(c => c.id === match.categoryId)?.name;
              const walletName = data.wallets.find(w => w.id === match.walletId)?.name;
              
              if (catName) {
                  hints.push(`- Eslatma: Tarixda "${word}" so'zi uchun "${catName}" kategoriyasi ishlatilgan.`);
              }
              if (walletName) {
                  hints.push(`- Eslatma: "${word}" uchun odatda "${walletName}" hamyonidan to'langan.`);
              }
          }
      });

      // Takroriy maslahatlarni olib tashlaymiz va chiroyli string qilamiz
      return Array.from(new Set(hints)).slice(0, 5).join('\n');
  };

  // --- 3. SYSTEM PROMPT (AI miyasi - Example bilan) ---
  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    // Moliya holati
    const income = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');
    const smartHints = findSmartPatterns(userQuery);

    return `
      Sen professional hisobchisan. Bugun: ${today.toISOString().split('T')[0]}.
      
      MOLIYAVIY HOLAT:
      - Kirim: ${income} | Chiqim: ${expense} | Qoldiq: ${balance}
      - Kategoriyalar: ${catList}
      - Hamyonlar: ${walletList}
      
      ODATLAR: ${smartHints}
      Prompt: ${data.settings.customPrompt || ""}

      QAT'IY QOIDALAR VA NAMUNALAR (SHART!):

      1. AGAR FOYDALANUVCHI AMAL QO'SHSA (Kirim yoki Chiqim):
         Javobni DOIM JSON Array formatida qaytar.
         
         NAMUNA (EXAMPLE):
         User: "Tushlik 50k, Oylik 5mln tushdi"
         Assistant:
         [
           {
             "action": "add",
             "amount": 50000,
             "type": "expense",
             "category": "Oziq-ovqat",
             "wallet": "Naqd",
             "date": "2026-01-29",
             "note": "Tushlik"
           },
           {
             "action": "add",
             "amount": 5000000,
             "type": "income",
             "category": "Maosh",
             "wallet": "Plastik",
             "date": "2026-01-29",
             "note": "Oylik"
           }
         ]

      2. AGAR FOYDALANUVCHI QIDIRSA:
         NAMUNA: [{"action": "search", "query": "taksi"}]

      3. AGAR SAVOL-JAVOB BO'LSA (Tahlil):
         JSON ishlatma! Shunchaki matn yoz.
         Misol: "Sizning ahvolingiz yaxshi, lekin kofega ko'p sarflayapsiz."

      4. MANTIQ:
         - Kirim so'zlari: "tushdi, oldim (pul), oylik, bonus" -> "type": "income"
         - Chiqim so'zlari: "ketdi, oldim (narsa), to'ladim, ishlatdim" -> "type": "expense"

      Javobingda faqat toza JSON yoki toza matn bo'lsin. Markdown (qqqjson) ishlatma.
    `;
  };

  // --- 4. AI PROVIDER CALL (Request yuborish) ---
  const callAIProvider = async (provider: string, key: string, prompt: string, userMsg: string) => {
      console.log(`Sending request to ${provider}...`);
      
      if (provider === 'gemini') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: prompt + `\n\nFoydalanuvchi xabari: ${userMsg}` }] }]
              })
          });
          
          if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);
          const json = await res.json();
          return json.candidates?.[0]?.content?.parts?.[0]?.text;
      } 
      else if (provider === 'groq') {
          const res = await fetch('[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)', {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${key}`, 
                  'Content-Type': 'application/json' 
              },
              body: JSON.stringify({
                  model: "llama3-8b-8192", // Yoki "mixtral-8x7b-32768"
                  messages: [
                      { role: "system", content: prompt },
                      { role: "user", content: userMsg }
                  ]
              })
          });

          if (!res.ok) throw new Error(`Groq Error: ${res.status}`);
          const json = await res.json();
          return json.choices?.[0]?.message?.content;
      }
      throw new Error("Unknown provider");
  };

  // --- 5. HANDLE SEND (Asosiy funksiya) ---
  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!hasKey) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "⚠️ Diqqat: API kalit topilmadi. Iltimos, Profil bo'limiga o'tib kalitni kiriting va saqlang." }]);
        return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const systemPrompt = getSystemContext(userMsg.content);
        
        // --- PROVIDER FALLBACK LOGIKASI ---
        const preferred = data.settings.preferredProvider;
        const providers = [];
        
        // 1. Asosiy tanlangan provayder
        if (preferred === 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred === 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });
        
        // 2. Zaxira provayder (agar birinchisi ishlamasa)
        if (preferred !== 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred !== 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });

        let aiText = "";
        let success = false;
        
        // Provayderlarni aylanib chiqamiz
        for (const p of providers) {
            try {
                aiText = await callAIProvider(p.name, p.key, systemPrompt, userMsg.content) || "";
                if (aiText) {
                    success = true; 
                    break; // Muvaffaqiyatli bo'lsa to'xtatamiz
                }
            } catch (e) {
                console.error(`${p.name} provayderida xatolik:`, e);
            }
        }

        if (!success) throw new Error("Barcha AI provayderlar xato berdi yoki limit tugagan.");

        // --- 6. JSON PARSING & EXECUTION ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: aiText };
        
        // Markdown belgilarini tozalash (```json ... ```)
        let cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Agar AI bitta obyekt {} qaytarsa, uni Array [{}] ga o'zgartiramiz
        if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
            cleanJson = `[${cleanJson}]`;
        }

        // Agar JSON Array bo'lsa, o'qiymiz
        if (cleanJson.startsWith('[') && cleanJson.endsWith(']')) {
            try {
                const actionsArray = JSON.parse(cleanJson);
                
                let addedCount = 0;
                let totalAmount = 0;
                let searchResults: any[] = [];
                let actionType = '';

                if (Array.isArray(actionsArray)) {
                    // Har bir amalni bajaramiz
                    for (const actionData of actionsArray) {
                        
                        if (actionData.action === 'add') {
                             actionType = 'add';
                             
                             // Kategoriyani topish
                             const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(actionData.category.toLowerCase())) || data.categories[0];
                             
                             // Hamyonni topish
                             const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(actionData.wallet?.toLowerCase())) || data.wallets[0];
                             
                             // Yangi tranzaksiya obyekti
                             const newTx = { 
                                 id: Date.now().toString() + Math.random().toString().slice(2,5), // Unikal ID
                                 amount: parseFloat(actionData.amount), 
                                 type: actionData.type, 
                                 walletId: matchedWallet.id, 
                                 categoryId: matchedCat.id, 
                                 date: actionData.date || new Date().toISOString().split('T')[0], 
                                 note: actionData.note || 'AI orqali' 
                             };
                             
                             // Bazaga yozish
                             onAddTransaction(newTx);
                             
                             addedCount++;
                             // Faqat informatsiya uchun total hisoblaymiz (Kirimni ham qo'shib ketaveramiz statistikaga)
                             totalAmount += newTx.amount;
                        } 
                        else if (actionData.action === 'search') {
                             actionType = 'search';
                             const query = actionData.query.toLowerCase();
                             const res = data.transactions.filter(t => 
                                 t.note?.toLowerCase().includes(query) || 
                                 data.categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)
                             ).slice(0, 5);
                             searchResults = [...searchResults, ...res];
                        }
                    }
                }

                // --- 7. NATIJA XABARINI SHAKLLANTIRISH ---
                if (actionType === 'add' && addedCount > 0) {
                    processedMsg.content = `✅ Muvaffaqiyatli bajarildi!\nJami ${addedCount} ta amal qo'shildi.`;
                    processedMsg.actionResult = { type: 'multi_success', count: addedCount, total: totalAmount };
                } else if (actionType === 'search') {
                    processedMsg.content = `🔎 Qidiruv natijalari:`;
                    processedMsg.actionResult = { type: 'search', items: searchResults };
                }

            } catch (e) { 
                console.log("Matnli javob (JSON emas):", e);
                // Agar JSON bo'lmasa, demak AI shunchaki gapirgan. O'z holicha qoldiramiz.
            }
        }
        
        setMessages(prev => [...prev, processedMsg]);

    } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "❌ Xatolik yuz berdi. Internet aloqasini yoki API kalitlarni tekshiring." }]);
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      
      {/* HEADER QISMI */}
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-[#bb86fc]" size={20}/> AI Yordamchi
          </h2>
          {!hasKey && (
              <div className="flex items-center gap-1 text-yellow-500 animate-pulse">
                  <AlertTriangle size={16}/> <span className="text-xs font-bold">Kalit yo'q</span>
              </div>
          )}
      </div>
      
      {/* CHAT OYNASI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>
                      {msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}
                  </div>
                  
                  <div className={`max-w-[85%] space-y-2`}>
                      {/* Xabar matni */}
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>
                          {msg.content}
                      </div>
                      
                      {/* MULTI SUCCESS (Yashil blok) */}
                      {msg.actionResult?.type === 'multi_success' && (
                          <div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3 animate-slideUp">
                              <ListChecks className="text-[#107c41]" size={24}/>
                              <div>
                                  <p className="text-white text-xs font-bold">{msg.actionResult.count} ta amal qo'shildi</p>
                                  {msg.actionResult.total > 0 && <p className="text-gray-400 text-[10px]">Umumiy summa: {msg.actionResult.total.toLocaleString()} so'm</p>}
                              </div>
                          </div>
                      )}

                      {/* SEARCH RESULTS (Qidiruv natijalari) */}
                      {msg.actionResult?.type === 'search' && (
                          <div className="space-y-2 animate-slideUp">
                              {msg.actionResult.items.map((t: any, idx: number) => (
                                  <div key={idx} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center">
                                      <div>
                                          <p className="text-gray-400 text-[10px]">{t.date}</p>
                                          <p className="text-white text-xs">{t.note}</p>
                                      </div>
                                      <span className={`text-xs font-bold ${t.type === 'income' ? 'text-[#00d4ff]' : 'text-white'}`}>
                                          {t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()}
                                      </span>
                                  </div>
                              ))}
                              {msg.actionResult.items.length === 0 && <p className="text-gray-500 text-xs italic">Hech narsa topilmadi.</p>}
                          </div>
                      )}
                  </div>
              </div>
          ))}
          
          {/* Yuklanmoqda animatsiyasi */}
          {loading && (
              <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-[#0a0e17]"/>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs italic">
                      AI ma'lumotlarni tahlil qilmoqda...
                  </div>
              </div>
          )}
      </div>

      {/* INPUT QISMI */}
      <div className="p-4 bg-[#0a0e17] border-t border-white/5">
          <div className="relative">
              <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  placeholder={hasKey ? "Xarajatlarni yozing (masalan: Non 5000, Yo'l 2000)..." : "Profilga o'tib API kalit kiriting..."} 
                  disabled={!hasKey || loading} 
                  className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm disabled:opacity-50"
              />
              <button 
                  onClick={handleSend} 
                  disabled={loading || !input.trim() || !hasKey} 
                  className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform"
              >
                  <Send size={18} fill="#0a0e17"/>
              </button>
          </div>
      </div>
    </div>
  );
}
