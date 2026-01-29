import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, ListChecks, AlertTriangle } from 'lucide-react';
import { AppData, Transaction } from '../types';

interface Props { data: AppData; onAddTransaction: (tx: Transaction) => void; }
interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; actionResult?: any; }

export default function AIPage({ data, onAddTransaction }: Props) {
  const [input, setInput] = useState('');
  // Boshlang'ich xabar
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', role: 'assistant', content: `Salom, ${data.profile.name}! \nMen tayyorman. Menga xarajatlar ro'yxatini tashlashingiz yoki savol berishingiz mumkin.` }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agar kalit umuman bo'lmasa, ogohlantirish (Render qismida ishlatamiz)
  const hasKey = !!(data.settings.geminiKey || data.settings.groqKey);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // --- 1. AQLLI PATTERN (Tarixni o'rganish) ---
  const findSmartPatterns = (userInput: string): string => {
      const words = userInput.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3); // So'zlarni ajratamiz
      const hints: string[] = [];
      
      words.forEach(word => {
          // Tarixdan shu so'z qatnashgan oxirgi amalni topamiz
          const match = data.transactions.find(t => t.note?.toLowerCase().includes(word));
          if (match) {
              const catName = data.categories.find(c => c.id === match.categoryId)?.name;
              const walletName = data.wallets.find(w => w.id === match.walletId)?.name;
              
              if (catName) hints.push(`- Tarixda "${word}" so'zi uchun "${catName}" kategoriyasi ishlatilgan.`);
              if (walletName) hints.push(`- "${word}" uchun odatda "${walletName}" hamyonidan to'langan.`);
          }
      });
      // Takroriy maslahatlarni olib tashlaymiz
      return Array.from(new Set(hints)).slice(0, 5).join('\n'); // Maksimum 5 ta maslahat
  };

  // --- 2. TIZIM BUYRUG'I (PROMPT) ---
  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');
    const smartHints = findSmartPatterns(userQuery);

    return `
      Sen professional hisobchisan. Bugun: ${today.toISOString().split('T')[0]}.
      Mavjud Kategoriyalar: ${catList}
      Mavjud Hamyonlar: ${walletList}
      
      Foydalanuvchi Sozlamasi (Custom Prompt): ${data.settings.customPrompt || "Yo'q"}
      
      TARIXDAN O'RGANILGAN MASLAHATLAR:
      ${smartHints || "Hozircha yo'q, umumiy mantiqqa tayan."}

      QAT'IY QOIDALAR:
      1. UZUN RO'YXATLAR: Agar foydalanuvchi ko'p narsa yozsa (masalan: "Non 5000, Tushlik 50000, Taksi 20000"), har birini alohida obyekt qilib, JSON ARRAY qaytar.
      
      2. TYPE (Kirim/Chiqim) ANIQLASH:
         - Kirim: "tushdi", "oylik", "bonus", "qarz oldim", "keldi", "berishdi". (type: "income")
         - Chiqim: "ketdi", "sotib oldim", "yubordim", "to'ladim", "xarajat", "ishlatdim". (type: "expense")
      
      3. JAVOB FORMATI (Faqat JSON Array):
         [
           {"action": "add", "amount": 5000, "type": "expense", "category": "Oziq-ovqat", "wallet": "Naqd", "date": "2024-01-01", "note": "Non"},
           {"action": "add", "amount": 2000000, "type": "income", "category": "Maosh", "wallet": "Plastik", "date": "2024-01-01", "note": "Oylik"}
         ]

      4. QIDIRUV UCHUN: [{"action": "search", "query": "..."}]

      5. AGAR SAVOL BO'LSA: JSON ishlatma, shunchaki qisqa matn yoz.
    `;
  };

  // --- 3. AI PROVIDER CALL ---
  const callAIProvider = async (provider: string, key: string, prompt: string, userMsg: string) => {
      if (provider === 'gemini') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt + `\n\nFoydalanuvchi: ${userMsg}` }] }] })
          });
          if (!res.ok) throw new Error("Gemini Error");
          const json = await res.json();
          return json.candidates?.[0]?.content?.parts?.[0]?.text;
      } 
      else if (provider === 'groq') {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "system", content: prompt }, { role: "user", content: userMsg }] })
          });
          if (!res.ok) throw new Error("Groq Error");
          const json = await res.json();
          return json.choices?.[0]?.message?.content;
      }
      throw new Error("Unknown provider");
  };
  // --- 4. ASOSIY LOGIKA (Handle Send) ---
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Agar kalit bo'lmasa
    if (!hasKey) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Iltimos, avval Profil bo'limidan API kalit kiriting va saqlang." }]);
        return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const systemPrompt = getSystemContext(userMsg.content);
        
        // Provayderlarni yig'amiz (Preferred + Fallback)
        const preferred = data.settings.preferredProvider;
        const providers = [];
        // Birinchi bo'lib afzal ko'rganini qo'shamiz
        if (preferred === 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred === 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });
        // Keyin qolganini zaxira sifatida qo'shamiz
        if (preferred !== 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred !== 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });

        let aiText = "";
        let success = false;
        
        // Har bir provayderni sinab ko'ramiz
        for (const p of providers) {
            try {
                aiText = await callAIProvider(p.name, p.key, systemPrompt, userMsg.content) || "";
                success = true; break; // O'xshadi, loopni to'xtat
            } catch (e) { console.error(`${p.name} failed, trying next...`); }
        }

        if (!success) throw new Error("Barcha AI provayderlar ishlamayapti.");

        // --- JSON ISHLOV BERISH ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: aiText };
        
        // JSON ni tozalash (Markdown belgilarini olib tashlash)
        let cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Agar AI bitta obyekt {} qaytarsa, uni Array [{}] ga aylantiramiz
        if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
            cleanJson = `[${cleanJson}]`;
        }

        // Agar Array bo'lsa, o'qiymiz
        if (cleanJson.startsWith('[') && cleanJson.endsWith(']')) {
            try {
                const actionsArray = JSON.parse(cleanJson);
                
                let addedCount = 0;
                let totalAmount = 0;
                let searchResults: any[] = [];
                let actionType = '';

                if (Array.isArray(actionsArray)) {
                    for (const actionData of actionsArray) {
                        
                        if (actionData.action === 'add') {
                             actionType = 'add';
                             // Kategoriya va Hamyonni topish
                             const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(actionData.category.toLowerCase())) || data.categories[0];
                             const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(actionData.wallet?.toLowerCase())) || data.wallets[0];
                             
                             const newTx = { 
                                 id: Date.now().toString() + Math.random().toString().slice(2,5), 
                                 amount: parseFloat(actionData.amount), 
                                 type: actionData.type, 
                                 walletId: matchedWallet.id, 
                                 categoryId: matchedCat.id, 
                                 date: actionData.date || new Date().toISOString().split('T')[0], 
                                 note: actionData.note || 'AI Auto' 
                             };
                             
                             onAddTransaction(newTx);
                             addedCount++;
                             totalAmount += (actionData.type === 'expense' ? newTx.amount : 0); // Faqat xarajatni hisoblaymiz info uchun
                        } 
                        else if (actionData.action === 'search') {
                             actionType = 'search';
                             const query = actionData.query.toLowerCase();
                             const res = data.transactions.filter(t => t.note?.toLowerCase().includes(query) || data.categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)).slice(0, 5);
                             searchResults = [...searchResults, ...res];
                        }
                    }
                }

                // Xabarni chiroyli qilish
                if (actionType === 'add' && addedCount > 0) {
                    processedMsg.content = `✅ Jami ${addedCount} ta amal bajarildi.`;
                    processedMsg.actionResult = { type: 'multi_success', count: addedCount, total: totalAmount };
                } else if (actionType === 'search') {
                    processedMsg.content = `🔎 Topilgan ma'lumotlar:`;
                    processedMsg.actionResult = { type: 'search', items: searchResults };
                }

            } catch (e) { 
                console.log("Not JSON text, showing regular message");
            }
        }
        
        setMessages(prev => [...prev, processedMsg]);

    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Xatolik: Internetni yoki API kalitlarni tekshiring." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="text-[#bb86fc]" size={20}/> AI Yordamchi</h2>
          {!hasKey && <AlertTriangle size={18} className="text-yellow-500 animate-pulse"/>}
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>{msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}</div>
                  <div className={`max-w-[85%] space-y-2`}>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>{msg.content}</div>
                      
                      {/* MULTI SUCCESS (Yashil blok) */}
                      {msg.actionResult?.type === 'multi_success' && (
                          <div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3 animate-slideUp">
                              <ListChecks className="text-[#107c41]" size={24}/>
                              <div>
                                  <p className="text-white text-xs font-bold">{msg.actionResult.count} ta amal qo'shildi</p>
                                  {msg.actionResult.total > 0 && <p className="text-gray-400 text-[10px]">Xarajatlar: {msg.actionResult.total.toLocaleString()} so'm</p>}
                              </div>
                          </div>
                      )}

                      {/* SEARCH RESULTS (Qidiruv natijalari) */}
                      {msg.actionResult?.type === 'search' && (<div className="space-y-2 animate-slideUp">{msg.actionResult.items.map((t: any, idx: number) => (<div key={idx} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center"><span className="text-gray-400 text-xs">{t.date} | {t.note}</span><span className={`text-xs font-bold ${t.type === 'income' ? 'text-[#00d4ff]' : 'text-white'}`}>{t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()}</span></div>))}{msg.actionResult.items.length === 0 && <p className="text-gray-500 text-xs italic">Hech narsa topilmadi.</p>}</div>)}
                  </div>
              </div>
          ))}
          {loading && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[#0a0e17]"/></div><div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs italic">AI o'ylayapti...</div></div>)}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0a0e17] border-t border-white/5"><div className="relative"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={hasKey ? "Masalan: Tushlik 50k, Taksi 20k..." : "Avval kalitni kiriting..."} disabled={!hasKey} className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm disabled:opacity-50"/><button onClick={handleSend} disabled={loading || !input.trim() || !hasKey} className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform"><Send size={18} fill="#0a0e17"/></button></div></div>
    </div>
  );
}
