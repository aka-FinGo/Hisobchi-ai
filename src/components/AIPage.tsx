import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, ListChecks, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import { AppData, Transaction } from '../types';

interface Props {
  data: AppData;
  onAddTransaction: (tx: Transaction) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // Ekranda ko'rinadigan matn
  actionResult?: any; // Bajarilgan amal natijasi (JSON)
}

export default function AIPage({ data, onAddTransaction }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: `Salom, ${data.profile.name}! Men sizning moliyaviy tahlilchingizman.\n\nMen nima qila olaman:\n1. Xarajatlarni kiritish (bir nechta bo'lsa ham).\n2. Tarixni qidirish.\n3. Moliyaviy tahlil va maslahat berish.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // --- 1. AQLLI PATTERNLAR (Tarixni o'rganish) ---
  const findSmartPatterns = (userInput: string): string => {
      const words = userInput.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
      const hints: string[] = [];
      words.forEach(word => {
          const match = data.transactions.find(t => t.note?.toLowerCase().includes(word));
          if (match) {
              const catName = data.categories.find(c => c.id === match.categoryId)?.name;
              const walletName = data.wallets.find(w => w.id === match.walletId)?.name;
              if (catName) hints.push(`- "${word}" -> "${catName}" kategoriyasi.`);
              if (walletName) hints.push(`- "${word}" -> "${walletName}" hamyoni.`);
          }
      });
      return Array.from(new Set(hints)).join('; ');
  };

  // --- 2. SYSTEM PROMPT (ENG MUHIM QISM) ---
  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
    
    // MOLIYAVIY HOLAT (AI tahlil qilishi uchun)
    const income = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    
    // Top xarajatlar
    const catMap: Record<string, number> = {};
    data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).forEach(t => {
        const cName = data.categories.find(c => c.id === t.categoryId)?.name || 'Boshqa';
        catMap[cName] = (catMap[cName] || 0) + t.amount;
    });
    const topExpenses = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([k,v]) => `${k}: ${v}`).join(', ');

    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');
    const smartHints = findSmartPatterns(userQuery);

    return `
      Sen professional moliyaviy maslahatchisan. 
      Bugun: ${today.toISOString().split('T')[0]}.
      
      MOLIYAVIY HISOBOT (Joriy oy):
      - Kirim: ${income} | Chiqim: ${expense} | Qoldiq: ${balance}
      - Asosiy xarajatlar: ${topExpenses}
      
      MA'LUMOTLAR:
      - Kategoriyalar: ${catList}
      - Hamyonlar: ${walletList}
      - Odatlar: ${smartHints}
      - Custom Prompt: ${data.settings.customPrompt || "Yo'q"}

      VAZIFA: Foydalanuvchi so'rovini tushun va FAQAT JSON formatda javob qaytar.

      --- JSON EXAMPLES (NAMUNALAR) ---

      1. AMAL QO'SHISH (Transaction):
      {
        "type": "transaction",
        "items": [
          {"amount": 50000, "type": "expense", "category": "Oziq-ovqat", "wallet": "Naqd", "date": "2024-01-29", "note": "Tushlik"},
          {"amount": 2000000, "type": "income", "category": "Maosh", "wallet": "Plastik", "date": "2024-01-29", "note": "Avans"}
        ]
      }

      2. QIDIRISH (Search):
      {
        "type": "search",
        "query": "benzin"
      }

      3. TAHLIL VA MASLAHAT (Analysis):
      {
        "type": "analysis",
        "text": "Sizning moliyaviy holatingiz barqaror. Bu oy kirim 5mln bo'ldi, lekin xarajatlar 3mln ga yetdi. Ayniqsa Oziq-ovqatga ko'p ketyapti. Maslahatim: kunlik xarajatni 100k dan oshirmaslikka harakat qiling."
      }

      QOIDALAR:
      - Hech qanday "```json" belgisi ishlatma. Faqat toza JSON.
      - "Analysis" paytida yuqoridagi "MOLIYAVIY HISOBOT" ma'lumotlariga tayanib, aqlli maslahat ber.
    `;
  };
  // --- 3. API CALL (MODERN MODELS) ---
  const callAIProvider = async (provider: string, key: string, prompt: string, userMsg: string) => {
      console.log(`📡 Sending to ${provider}...`);
      
      try {
          if (provider === 'gemini') {
              // GEMINI 2.0 FLASH (Experimental) yoki 1.5 Flash
              const modelVersion = 'gemini-2.0-flash-exp'; 
              
              const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${key}`, {
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt + `\n\nUSER QUERY: ${userMsg}` }] }] })
              });

              if (!res.ok) {
                   // Agar 2.0 da xato bo'lsa, 1.5 ga o'tishimiz mumkin (Fallback logic handleSend da bo'ladi)
                   const errText = await res.text();
                   throw new Error(`Gemini Error ${res.status}: ${errText}`);
              }
              const json = await res.json();
              return json.candidates?.[0]?.content?.parts?.[0]?.text;
          } 
          else if (provider === 'groq') {
              // GROQ (LLAMA 3.3 - Eng yangi va kuchli)
              const res = await fetch('[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)', {
                  method: 'POST', 
                  headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      model: "llama-3.3-70b-versatile", // Yoki "llama3-8b-8192" tezlik uchun
                      messages: [{ role: "system", content: prompt }, { role: "user", content: userMsg }],
                      response_format: { type: "json_object" } // Groq JSON Mode
                  })
              });

              if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`Groq Error ${res.status}: ${errText}`);
              }
              const json = await res.json();
              return json.choices?.[0]?.message?.content;
          }
      } catch (e: any) {
          console.error("API Call Failed:", e);
          throw e; 
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
        const geminiKey = data.settings.geminiKey;
        const groqKey = data.settings.groqKey;
        if (!geminiKey && !groqKey) throw new Error("API kalitlar kiritilmagan. Profilni tekshiring.");

        const systemPrompt = getSystemContext(userMsg.content);
        const preferred = data.settings.preferredProvider;
        const providers = [];
        
        // Priority navbati
        if (preferred === 'gemini' && geminiKey) providers.push({ name: 'gemini', key: geminiKey });
        if (preferred === 'groq' && groqKey) providers.push({ name: 'groq', key: groqKey });
        if (preferred !== 'gemini' && geminiKey) providers.push({ name: 'gemini', key: geminiKey }); // Fallback
        if (preferred !== 'groq' && groqKey) providers.push({ name: 'groq', key: groqKey }); // Fallback

        let aiText = "";
        let success = false;
        let lastError = "";

        for (const p of providers) {
            try {
                aiText = await callAIProvider(p.name, p.key, systemPrompt, userMsg.content) || "";
                success = true; break;
            } catch (e: any) { lastError = e.message; }
        }

        if (!success) throw new Error(`Barcha urinishlar xato berdi.\n${lastError}`);

        // --- JSON PARSING (Universal) ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: "..." };
        let cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result = JSON.parse(cleanJson);

            // 1. HOLAT: AMAL QO'SHISH (Items Array)
            if (result.type === 'transaction' && Array.isArray(result.items)) {
                let addedCount = 0;
                let totalAmount = 0;
                
                for (const item of result.items) {
                     const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(item.category.toLowerCase())) || data.categories[0];
                     const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(item.wallet?.toLowerCase())) || data.wallets[0];
                     
                     const newTx = { 
                         id: Date.now().toString() + Math.random().toString().slice(2,6), 
                         amount: parseFloat(item.amount), 
                         type: item.type, 
                         walletId: matchedWallet.id, 
                         categoryId: matchedCat.id, 
                         date: item.date || new Date().toISOString().split('T')[0], 
                         note: item.note || 'AI' 
                     };
                     onAddTransaction(newTx);
                     addedCount++;
                     totalAmount += newTx.amount;
                }
                processedMsg.content = `✅ Jami ${addedCount} ta amal kiritildi.\nUmumiy summa: ${totalAmount.toLocaleString()} so'm.`;
                processedMsg.actionResult = { type: 'transaction', count: addedCount, total: totalAmount };
            }
            
            // 2. HOLAT: QIDIRUV
            else if (result.type === 'search') {
                const query = result.query.toLowerCase();
                const items = data.transactions.filter(t => 
                    t.note?.toLowerCase().includes(query) || 
                    data.categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)
                ).slice(0, 5);
                processedMsg.content = `🔎 "${query}" bo'yicha qidiruv natijalari:`;
                processedMsg.actionResult = { type: 'search', items };
            }

            // 3. HOLAT: TAHLIL YOKI SUHBAT
            else if (result.type === 'analysis') {
                processedMsg.content = result.text; // AI yozgan tahliliy matn
                processedMsg.actionResult = { type: 'analysis' };
            }

        } catch (e) {
            console.error("JSON Parse Error:", e);
            processedMsg.content = aiText; // JSON bo'lmasa matnni o'zini chiqaramiz
        }
        
        setMessages(prev => [...prev, processedMsg]);

    } catch (error: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ XATOLIK: ${error.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="text-[#bb86fc]" size={20}/> AI Tahlilchi</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>{msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}</div>
                  
                  <div className={`max-w-[85%] space-y-2`}>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>
                          {msg.content.startsWith('⚠️') ? <span className="text-red-400 font-bold">{msg.content}</span> : msg.content}
                      </div>

                      {/* --- RESULT UI --- */}
                      
                      {msg.actionResult?.type === 'transaction' && (
                          <div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3 animate-slideUp">
                              <ListChecks className="text-[#107c41]" size={20}/>
                              <div>
                                  <p className="text-white text-xs font-bold">{msg.actionResult.count} ta amal bajarildi</p>
                                  <p className="text-gray-400 text-[10px]">Summa: {msg.actionResult.total.toLocaleString()} so'm</p>
                              </div>
                          </div>
                      )}

                      {msg.actionResult?.type === 'search' && (
                          <div className="space-y-2 animate-slideUp">
                              {msg.actionResult.items.map((t: any, idx: number) => (
                                  <div key={idx} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center">
                                      <span className="text-gray-400 text-xs">{t.date} | {t.note}</span>
                                      <span className="text-white text-xs font-bold">{t.amount.toLocaleString()}</span>
                                  </div>
                              ))}
                              {msg.actionResult.items.length === 0 && <p className="text-gray-500 text-xs italic">Hech narsa topilmadi.</p>}
                          </div>
                      )}

                      {msg.actionResult?.type === 'analysis' && (
                          <div className="flex gap-2 mt-1">
                              <span className="text-[10px] text-[#bb86fc] bg-[#bb86fc]/10 px-2 py-1 rounded flex items-center gap-1"><PieChart size={10}/> Moliyaviy Tahlil</span>
                          </div>
                      )}
                  </div>
              </div>
          ))}
          {loading && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[#0a0e17]"/></div><div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs italic">Tahlil qilinmoqda...</div></div>)}
      </div>

      <div className="p-4 bg-[#0a0e17] border-t border-white/5"><div className="relative"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Xarajat yozing yoki 'Ahvolim qanday?' deb so'rang..." className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm"/><button onClick={handleSend} disabled={loading || !input.trim()} className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform"><Send size={18} fill="#0a0e17"/></button></div></div>
    </div>
  );
}
