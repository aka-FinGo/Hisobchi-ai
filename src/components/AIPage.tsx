import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: `Salom, ${data.profile.name}! Men sizning moliyaviy yordamchingizman. Yangi modellar bilan ishlayapman.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agar kalit umuman yo'q bo'lsa
  if (!data.settings.geminiKey && !data.settings.groqKey) {
      return (
          <div className="h-full bg-[#0a0e17] flex flex-col items-center justify-center p-6 text-center animate-slideUp">
             <div className="w-20 h-20 bg-[#141e3c] rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                 <Sparkles size={40} className="text-[#00d4ff]"/>
             </div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Yordamchini Yoqish</h2>
              <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                  Iltimos, Profil bo'limiga o'tib, API kalit kiriting va <b>Saqlash</b> tugmasini bosing.
              </p>
          </div>
      );
  }

  // Chat pastga tushishi uchun
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // --- 1. ODALARNI O'RGANISH (Context Learning) ---
  const findSmartPatterns = (userInput: string): string => {
      const words = userInput.toLowerCase().split(' ').filter(w => w.length > 3);
      const hints: string[] = [];
      words.forEach(word => {
          const match = data.transactions.find(t => t.note?.toLowerCase().includes(word));
          if (match) {
              const catName = data.categories.find(c => c.id === match.categoryId)?.name;
              if (catName) hints.push(`- Tarixda "${word}" so'zi qatnashganda "${catName}" kategoriyasi tanlangan.`);
          }
      });
      return Array.from(new Set(hints)).join('\n');
  };

  // --- 2. TIZIM BUYRUG'INI YASASH (SYSTEM PROMPT) ---
  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    // Moliyaviy Statistika
    const income = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    
    // Oxirgi 10 ta operatsiya (AI ko'rishi uchun)
    const recentTx = data.transactions.slice(-10).reverse().map(t => 
        `[${t.date}] ${t.type === 'income' ? '+' : '-'}${t.amount} (${data.categories.find(c => c.id === t.categoryId)?.name || 'Nomaʼlum'}) - ${t.note || ''}`
    ).join('\n');

    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');
    const smartHints = findSmartPatterns(userQuery);

    // Prompt (Markdown xatoligini oldini olish uchun backtick ishlatilmagan joylarga e'tibor bering)
    return `
      Sen professional buxgalter va moliyaviy yordamchisan. 
      Bugungi sana: ${today.toISOString().split('T')[0]}.
      
      FOYDALANUVCHI HOLATI:
      - Bu oy jami kirim: ${income}
      - Bu oy jami chiqim: ${expense}
      - Hamyonlar: ${walletList}
      - Kategoriyalar: ${catList}
      
      OXIRGI AMALLAR TARIXI:
      ${recentTx || "Hozircha amallar yo'q."}

      AI UCHUN MAXSUS ESLATMALAR (Patternlar):
      ${smartHints}

      FOYDALANUVCHI SOZLAMASI (Custom Prompt):
      ${data.settings.customPrompt || ""}

      QAT'IY QOIDALAR:
      1. Agar foydalanuvchi amal qo'shmoqchi bo'lsa, JSON formatda javob qaytar:
         {"action": "add", "amount": 1000, "type": "expense", "category": "...", "wallet": "...", "date": "YYYY-MM-DD", "note": "..."}
      
      2. Agar qidirmoqchi bo'lsa, JSON qaytar:
         {"action": "search", "query": "..."}
      
      3. Oddiy savol-javob yoki maslahat uchun oddiy matn qaytar.
      
      MUHIM: Javobingda hech qachon markdown kod belgilarini (uchta backtick) ishlatma. Faqat toza JSON yoki toza matn yoz.
    `;
  };

  // --- 3. API GA SO'ROV YUBORISH (Engine) ---
  const callAIProvider = async (provider: string, key: string, prompt: string, userMsg: string) => {
      // 1. Sozlamalardagi modelni olamiz. Agar u bo'lmasa, provayderga mos defaultni olamiz.
      const model = data.settings.aiModel || (provider === 'gemini' ? 'gemini-2.5-flash' : 'llama3-8b-8192');

      if (provider === 'gemini') {
          // Gemini API (Google)
          // Model nomini URL ga dinamik qo'yamiz
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: prompt + `\n\nFoydalanuvchi: ${userMsg}` }] }]
              })
          });

          if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);
          const json = await res.json();
          return json.candidates?.[0]?.content?.parts?.[0]?.text;
      } 
      else if (provider === 'groq') {
          // Groq API
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${key}`, 
                  'Content-Type': 'application/json' 
              },
              body: JSON.stringify({
                  model: model, // Tanlangan model shu yerga ketadi
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
      throw new Error("Noma'lum provayder");
  };

  // --- 4. XABAR YUBORISH (Handler) ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const systemPrompt = getSystemContext(userMsg.content);
        
        // Provayderlarni tartiblash (Preferred birinchi)
        const preferred = data.settings.preferredProvider;
        const providers = [];
        
        // Agar preferred kaliti bor bo'lsa, ro'yxat boshiga qo'shamiz
        if (preferred === 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred === 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });
        
        // Qolganlarini zaxira sifatida qo'shamiz
        if (preferred !== 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred !== 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });

        let aiText = "";
        let success = false;
        
        // Har bir provayderni birma-bir sinab ko'ramiz (Retry Logic)
        for (const p of providers) {
            try {
                // console.log(`Urinib ko'rilmoqda: ${p.name}, Model: ${data.settings.aiModel}`);
                aiText = await callAIProvider(p.name, p.key, systemPrompt, userMsg.content) || "";
                success = true;
                break; // O'xshadi, siklni to'xtatamiz
            } catch (e) {
                console.error(`${p.name} ishlamadi, keyingisi...`, e);
            }
        }

        if (!success) throw new Error("Barcha AI provayderlar xato berdi.");

        // --- 5. JAVOBNI QAYTA ISHLASH (JSON parsing) ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: aiText };
        
        try {
            // Ba'zan AI ```json ... ``` deb javob beradi, shuni tozalaymiz
            const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

            if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
                const actionData = JSON.parse(cleanJson);
                
                // A) AMAL QO'SHISH
                if (actionData.action === 'add') {
                     const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(actionData.category.toLowerCase())) || data.categories[0];
                     const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(actionData.wallet?.toLowerCase())) || data.wallets[0];
                     
                     const newTx = { 
                         id: Date.now().toString(), 
                         amount: parseFloat(actionData.amount), 
                         type: actionData.type, 
                         walletId: matchedWallet.id, 
                         categoryId: matchedCat.id, 
                         date: actionData.date || new Date().toISOString().split('T')[0], 
                         note: actionData.note || 'AI yordamida' 
                     };
                     
                     onAddTransaction(newTx);
                     
                     // Foydalanuvchiga chiroyli hisobot
                     processedMsg.content = `✅ Bajarildi! ${newTx.amount.toLocaleString()} so'm "${matchedCat.name}" kategoriyasiga qo'shildi.`;
                     processedMsg.actionResult = { type: 'success', tx: newTx };
                } 
                // B) QIDIRUV
                else if (actionData.action === 'search') {
                     const query = actionData.query.toLowerCase();
                     const results = data.transactions.filter(t => 
                        t.note?.toLowerCase().includes(query) || 
                        data.categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)
                     ).slice(0, 5); // Top 5
                     
                     processedMsg.content = `🔎 "${query}" bo'yicha topilgan natijalar:`;
                     processedMsg.actionResult = { type: 'search', items: results };
                }
            }
        } catch (e) {
            // JSON emas, demak oddiy matn. Hech narsa qilmaymiz, o'zini chiqaramiz.
        }

        setMessages(prev => [...prev, processedMsg]);

    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Xatolik yuz berdi. Internetni yoki API kalitlarni tekshiring." }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      {/* HEADER */}
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-[#bb86fc]" size={20}/> AI Yordamchi
          </h2>
          {/* Kichkina indikator: Qaysi model ishlatilyapti */}
          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              {data.settings.aiModel || 'Auto'}
          </span>
      </div>
      
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>
                      {msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}
                  </div>
                  
                  <div className={`max-w-[85%] space-y-2`}>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>
                          {msg.content}
                      </div>

                      {/* ACTION RESULT CARDS */}
                      {msg.actionResult?.type === 'success' && (
                          <div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3 animate-slideUp">
                              <CheckCircle className="text-[#107c41]" size={20}/>
                              <div>
                                  <p className="text-white text-xs font-bold">Muvaffaqiyatli saqlandi</p>
                                  <p className="text-gray-400 text-[10px]">
                                      {msg.actionResult.tx.date} | {msg.actionResult.tx.amount.toLocaleString()} so'm
                                  </p>
                              </div>
                          </div>
                      )}

                      {msg.actionResult?.type === 'search' && (
                          <div className="space-y-2 animate-slideUp">
                              {msg.actionResult.items.map((t: any) => (
                                  <div key={t.id} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center">
                                      <span className="text-gray-400 text-xs">{t.date}</span>
                                      <div className="text-right">
                                          <span className={`text-xs font-bold ${t.type === 'income' ? 'text-[#00ff9d]' : 'text-white'}`}>
                                              {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                                          </span>
                                          <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{t.note}</p>
                                      </div>
                                  </div>
                              ))}
                              {msg.actionResult.items.length === 0 && (
                                  <div className="p-2 text-center text-gray-500 text-xs italic bg-white/5 rounded-lg">
                                      Hech narsa topilmadi.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          ))}
          
          {loading && (
              <div className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-[#0a0e17]"/>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs rounded-tl-none italic border border-white/5">
                      O'ylayapman...
                  </div>
              </div>
          )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-[#0a0e17] border-t border-white/5">
          <div className="relative">
              <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Xarajat qo'shish yoki savol berish..."
                  className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm placeholder-gray-600"
              />
              <button 
                  onClick={handleSend} 
                  disabled={loading || !input.trim()} 
                  className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform shadow-[0_0_15px_rgba(187,134,252,0.3)]"
              >
                  <Send size={18} fill="#0a0e17"/>
              </button>
          </div>
      </div>
    </div>
  );
}
