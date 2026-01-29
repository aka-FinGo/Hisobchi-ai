import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle, ListChecks, PieChart, TrendingUp, Info } from 'lucide-react';
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
    { id: '1', role: 'assistant', content: `Salom, aka_FinGo! Gemini 2.5 Flash (v1alpha) tizimi faol. Moliyaviy tahlil va amallar uchun tayyorman.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // --- SYSTEM PROMPT (EXPLICIT FOR GEMINI 2.5) ---
  const getSystemContext = () => {
    const today = new Date().toISOString().split('T')[0];
    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');
    
    // Tahlil uchun joriy oy statistikasi
    const currentMonth = today.slice(0, 7);
    const income = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);

    return `
      System: You are a professional financial advisor.
      Today's Date: ${today}.
      Current Stats: Income: ${income}, Expenses: ${expense}, Balance: ${income - expense}.
      Available Wallets: [${walletList}].
      Categories: [${catList}].
      User Custom Prompt: ${data.settings.customPrompt || "None"}.

      TASKS: Analyze user input and respond ONLY in the following JSON format.
      
      --- JSON STRUCTURE EXAMPLES ---
      1. FOR ADDING TRANSACTIONS:
      {
        "type": "transaction",
        "items": [
          {"amount": 50000, "type": "expense", "category": "Oziq-ovqat", "wallet": "Naqd", "note": "Kofye"},
          {"amount": 1000000, "type": "income", "category": "Maosh", "wallet": "Plastik", "note": "Oylik"}
        ],
        "analysis": "Tahlil: Xarajat qo'shildi. Bu oy kofye uchun jami 300k ishlatdingiz."
      }

      2. FOR ANALYSIS/ADVICE:
      {
        "type": "analysis",
        "analysis": "Sizning moliyaviy ahvolingiz: Xarajatlar bu oy 15% ga oshgan. Tavsiyam: Keraksiz obunalarni bekor qiling."
      }

      3. FOR SEARCHING:
      {
        "type": "search",
        "query": "benzin",
        "analysis": "Benzin bo'yicha oxirgi amallaringizni qidiryapman..."
      }

      IMPORTANT: No markdown, no triple backticks. Just pure JSON object.
    `;
  };
  // --- MULTI-MODEL CALL (GEMINI 2.5 FLASH FIRST) ---
  const callAI = async (provider: string, key: string, prompt: string, userMsg: string) => {
    
    // --- MODELNI TANLASH ---
    const MODEL = provider === 'gemini' 
      ? (data.settings.geminiModel || 'gemini-2.5-flash') 
      : (data.settings.groqModel || 'llama-3.3-70b-versatile');

    try {
      if (provider === 'gemini') {
        // Dinamik model nomi va v1alpha versiyasi
        const url = `https://generativelanguage.googleapis.com/v1alpha/models/${MODEL}:generateContent?key=${key}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ 
              role: 'user', 
              parts: [{ text: prompt + "\n\nUser Request: " + userMsg }] 
            }] 
          })
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(`Gemini Alpha Error (${MODEL}): ${errData.error?.message || response.status}`);
        }
        
        const json = await response.json();
        return json.candidates[0].content.parts[0].text;

      } else {
        // Groq Compound (Fallback)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL, // Dinamik tanlangan Groq modeli
            messages: [{ role: "system", content: prompt }, { role: "user", content: userMsg }],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Groq Error (${MODEL}): ${errData.error?.message || response.status}`);
        }

        const json = await response.json();
        return json.choices[0].message.content;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const prompt = getSystemContext();
    const providers = [];
    
    // Tartib: 1. Gemini (2.5 Flash), 2. Groq
    if (data.settings.geminiKey) providers.push('gemini');
    if (data.settings.groqKey) providers.push('groq');

    let aiRaw = "";
    let success = false;
    let lastError = "";

    for (const p of providers) {
      try {
        const key = p === 'gemini' ? data.settings.geminiKey : data.settings.groqKey;
        aiRaw = await callAI(p, key!, prompt, userMsg.content);
        success = true;
        break;
      } catch (e: any) { 
        lastError = e.message;
        console.error(`${p} failed: ${e.message}`); 
      }
    }

    if (!success) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ Xatolik: ${lastError}. API sozlamalarini tekshiring.` }]);
      setLoading(false);
      return;
    }

    try {
      // JSONni tozalash
      const cleanJson = aiRaw.replace(/```json/g, '').replace(/```/g, '').trim();
      const res = JSON.parse(cleanJson);
      
      let assistantContent = res.analysis || "Natija tayyor.";
      let actionResult = null;

      if (res.type === 'transaction' && res.items) {
        res.items.forEach((item: any) => {
          const cat = data.categories.find(c => c.name.toLowerCase().includes(item.category.toLowerCase())) || data.categories[0];
          const wal = data.wallets.find(w => w.name.toLowerCase().includes(item.wallet.toLowerCase())) || data.wallets[0];
          
          onAddTransaction({
            id: Date.now().toString() + Math.random().toString().slice(2,6),
            amount: item.amount,
            type: item.type,
            walletId: wal.id,
            categoryId: cat.id,
            date: item.date || new Date().toISOString().split('T')[0],
            note: item.note
          });
        });
        actionResult = { type: 'success', count: res.items.length };
      } else if (res.type === 'search') {
        const results = data.transactions.filter(t => t.note?.toLowerCase().includes(res.query.toLowerCase())).slice(0, 5);
        actionResult = { type: 'search', items: results };
      } else if (res.type === 'analysis') {
        actionResult = { type: 'analysis' };
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantContent, actionResult }]);
    } catch (e) {
      // Agar JSON emas matn qaytsa
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiRaw }]);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] pb-24">
      <div className="p-4 border-b border-white/5 bg-[#141e3c]/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="text-[#00d4ff]" size={20}/> Hisobchi AI (2.5 Flash)</h2>
        {loading && <Loader2 className="animate-spin text-[#00d4ff]" size={18}/>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area" ref={scrollRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#00d4ff]' : 'bg-[#bb86fc]'}`}>
              {msg.role === 'user' ? <User size={16} className="text-[#0a0e17]"/> : <Bot size={16} className="text-[#0a0e17]"/>}
            </div>
            <div className="max-w-[85%] space-y-2">
              <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 border border-white/5'}`}>
                {msg.content}
              </div>
              
              {msg.actionResult?.type === 'success' && (
                <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-xl flex items-center gap-2 text-[10px] text-green-500 animate-slideUp">
                  <CheckCircle size={14}/> {msg.actionResult.count} ta amal bazaga yozildi.
                </div>
              )}
              
              {msg.actionResult?.type === 'search' && (
                <div className="space-y-1 animate-slideUp">
                  {msg.actionResult.items.map((t: any, i: number) => (
                    <div key={i} className="text-[10px] bg-white/5 p-2 rounded-lg flex justify-between border border-white/5">
                      <span className="text-gray-400">{t.date} | {t.note}</span>
                      <span className="font-bold">{t.amount.toLocaleString()} UZS</span>
                    </div>
                  ))}
                </div>
              )}
              
              {msg.actionResult?.type === 'analysis' && (
                <div className="flex gap-2">
                   <span className="text-[10px] bg-[#bb86fc]/20 text-[#bb86fc] px-2 py-0.5 rounded font-bold">📊 TAHLIL</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#0a0e17] border-t border-white/5">
        <div className="relative">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder="Tahlil yoki amalni yozing..." 
            className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 text-sm focus:border-[#00d4ff] transition-colors"
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()} 
            className="absolute right-2 top-2 p-2 bg-[#00d4ff] rounded-xl text-[#0a0e17] active:scale-95 disabled:opacity-50 transition-all"
          >
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}
