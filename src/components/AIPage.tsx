import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle } from 'lucide-react';
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
    { id: '1', role: 'assistant', content: `Salom, ${data.profile.name}! Men sizning odatlaringizni o'rganib oldim. Qanday yordam bera olaman?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Yo'riqnoma (Agar ikkala kalit ham yo'q bo'lsa)
  if (!data.settings.geminiKey && !data.settings.groqKey) {
      return (
          <div className="h-full bg-[#0a0e17] flex flex-col items-center justify-center p-6 text-center animate-slideUp">
             <div className="w-20 h-20 bg-[#141e3c] rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                <Sparkles size={40} className="text-[#00d4ff]"/>
             </div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Yordamchini Yoqish</h2>
              <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                  Iltimos, Profil bo'limiga o'tib, kamida bitta API kalit (Gemini yoki Groq) kiriting va SAQLASH tugmasini bosing.
              </p>
          </div>
      );
  }

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // Pattern qidiruvchi (Context Learning)
  const findSmartPatterns = (userInput: string): string => {
      const words = userInput.toLowerCase().split(' ').filter(w => w.length > 3);
      const hints: string[] = [];
      words.forEach(word => {
          const match = data.transactions.find(t => t.note?.toLowerCase().includes(word));
          if (match) {
              const catName = data.categories.find(c => c.id === match.categoryId)?.name;
              if (catName) hints.push(`- "${word}" deganda odatda "${catName}" kategoriyasi ishlatilgan.`);
          }
      });
      return Array.from(new Set(hints)).join('\n');
  };

  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');
    const smartHints = findSmartPatterns(userQuery);
    
    return `
      Sen moliyaviy yordamchisan. Vaqt: ${today.toISOString().split('T')[0]}.
      Hamyonlar: ${walletList}.
      Kategoriyalar: ${catList}.
      
      TARIXDAN O'RGANILGAN ODALAR:
      ${smartHints}

      QOIDALAR:
      1. Amal qo'shish uchun JSON: {"action": "add", "amount": 1000, "type": "expense", "category": "...", "wallet": "...", "date": "YYYY-MM-DD", "note": "..."}
      2. Qidirish uchun JSON: {"action": "search", "query": "..."}
      3. Savollarga qisqa matn bilan javob ber.
    `;
  };

  // --- FALLBACK LOGIKASI ---
  const callAIProvider = async (provider: string, key: string, prompt: string, userMsg: string) => {
      if (provider === 'gemini') {
          // Gemini 3 Flash Preview va x-goog-api-key header uslubi
          const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'; // Hozirgi barqaror preview
          const res = await fetch(`${url}?key=${key}`, { // URL orqali yuborish ishonchliroq
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contents: [{
                      parts: [{ text: prompt + `\n\nFoydalanuvchi so'rovi: ${userMsg}` }]
                  }],
                  generationConfig: {
                    temperature: 1,
                    maxOutputTokens: 1024,
                  }
              })
          });
          if (!res.ok) throw new Error("Gemini API xatosi");
          const json = await res.json();
          return json.candidates?.[0]?.content?.parts?.[0]?.text;
      } 
      
      else if (provider === 'groq') {
          // Siz bergan Groq Compound modeli va Tools sozlamalari
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${key}`, 
                  'Content-Type': 'application/json' 
              },
              body: JSON.stringify({
                  model: "llama-3.3-70b-versatile", // Compound model nomi provayderga qarab o'zgarishi mumkin
                  messages: [
                      { role: "system", content: prompt },
                      { role: "user", content: userMsg }
                  ],
                  temperature: 1,
                  max_completion_tokens: 1024,
                  top_p: 1,
                  // Compound model xususiyatlari (agar API qo'llab quvvatlasa)
                  compound_custom: {
                      tools: {
                          enabled_tools: ["web_search", "code_interpreter", "visit_website"]
                      }
                  }
              })
          });
          if (!res.ok) throw new Error("Groq API xatosi");
          const json = await res.json();
          return json.choices?.[0]?.message?.content;
      }
      throw new Error("Noma'lum provayder");
  };
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const systemPrompt = getSystemContext(userMsg.content);
        let aiText = "";
        
        // Provayderlarni tartiblash
        const preferred = data.settings.preferredProvider;
        const providers = [];
        
        if (preferred === 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred === 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });
        
        if (preferred !== 'gemini' && data.settings.geminiKey) providers.push({ name: 'gemini', key: data.settings.geminiKey });
        if (preferred !== 'groq' && data.settings.groqKey) providers.push({ name: 'groq', key: data.settings.groqKey });

        // Aylanib chiqamiz (Retry Logic)
        let success = false;
        for (const p of providers) {
            try {
                console.log(`AI: ${p.name} ishlatilmoqda...`);
                aiText = await callAIProvider(p.name, p.key, systemPrompt, userMsg.content);
                success = true;
                break;
            } catch (e) {
                console.error(`${p.name} xato:`, e);
            }
        }

        if (!success) throw new Error("Barcha AI provayderlar xato berdi.");

        // --- JSON Parsing ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: aiText || "Javob yo'q" };
        try {
            const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            if (cleanJson.startsWith('{')) {
                const actionData = JSON.parse(cleanJson);
                if (actionData.action === 'add') {
                     const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(actionData.category.toLowerCase())) || data.categories[0];
                     const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(actionData.wallet?.toLowerCase())) || data.wallets[0];
                     const newTx = { id: Date.now().toString(), amount: parseFloat(actionData.amount), type: actionData.type, walletId: matchedWallet.id, categoryId: matchedCat.id, date: actionData.date || new Date().toISOString().split('T')[0], note: actionData.note || 'AI' };
                     onAddTransaction(newTx);
                     processedMsg.content = `✅ ${newTx.amount.toLocaleString()} so'm "${matchedCat.name}" ga qo'shildi.`;
                     processedMsg.actionResult = { type: 'success', tx: newTx };
                } else if (actionData.action === 'search') {
                     const query = actionData.query.toLowerCase();
                     const results = data.transactions.filter(t => t.note?.toLowerCase().includes(query)).slice(0,5);
                     processedMsg.content = `Qidiruv natijalari:`;
                     processedMsg.actionResult = { type: 'search', items: results };
                }
            }
        } catch(e) {}

        setMessages(prev => [...prev, processedMsg]);

    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Xatolik: API kalitlar ishlamayapti yoki limit tugagan." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-[#bb86fc]" size={20}/> AI Yordamchi
          </h2>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>
                      {msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}
                  </div>
                  <div className={`max-w-[80%] space-y-2`}>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>
                          {msg.content}
                      </div>
                      
                      {/* Action Results */}
                      {msg.actionResult?.type === 'success' && (
                          <div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3">
                              <CheckCircle className="text-[#107c41]" size={20}/>
                              <div><p className="text-white text-xs font-bold">Saqlandi</p></div>
                          </div>
                      )}
                      
                       {msg.actionResult?.type === 'search' && (
                          <div className="space-y-2">
                              {msg.actionResult.items.map((t: any) => (
                                  <div key={t.id} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center">
                                      <span className="text-gray-400 text-xs">{t.date}</span>
                                      <span className="text-white text-xs font-bold">{t.amount.toLocaleString()}</span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          ))}
          {loading && (
              <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[#0a0e17]"/></div>
                  <div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs italic">O'ylayapman...</div>
              </div>
          )}
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0a0e17] border-t border-white/5">
          <div className="relative">
              <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  placeholder="Xarajat yozing..." 
                  className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm"
              />
              <button onClick={handleSend} disabled={loading || !input.trim()} className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform">
                  <Send size={18} fill="#0a0e17"/>
              </button>
          </div>
      </div>
    </div>
  );
}
