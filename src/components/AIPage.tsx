/* --- START: AI PAGE (GEMINI v1alpha & GROQ COMPOUND) --- */
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ListChecks } from 'lucide-react';
import { AppData, Transaction } from '../types';

export default function AIPage({ data, onAddTransaction }: { data: AppData; onAddTransaction: (tx: Transaction) => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // START: Prompt Muhandisligi
  const getContext = () => {
    return `System: Financial AI. Respond strictly in JSON array.
    Wallets: ${data.wallets.map(w => w.name).join(',')}.
    Categories: ${data.categories.map(c => c.name).join(',')}.
    Action: [{"action":"add","amount":0,"type":"expense","category":"","note":""}]`;
  };

  // START: API Chaqiruvi
  const callAI = async (provider: string, key: string, msg: string) => {
    const MODEL = provider === 'gemini' ? data.settings.geminiModel : data.settings.groqModel;
    
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1alpha/models/${MODEL}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: getContext() + "\n\nUser: " + msg }] }] })
      });
      const json = await res.json();
      return json.candidates[0].content.parts[0].text;
    } else {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: getContext() }, { role: "user", content: msg }],
          response_format: { type: "json_object" }
        })
      });
      const json = await res.json();
      return json.choices[0].message.content;
    }
  };

  // START: Xabarni qayta ishlash
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const provider = data.settings.preferredProvider;
      const key = provider === 'gemini' ? data.settings.geminiKey : data.settings.groqKey;
      const raw = await callAI(provider, key || '', userMsg.content);
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const results = JSON.parse(clean.startsWith('[') ? clean : `[${clean}]`);

      results.forEach((res: any) => {
        if (res.action === 'add') {
          const cat = data.categories.find(c => c.name.toLowerCase().includes(res.category.toLowerCase())) || data.categories[0];
          onAddTransaction({
            id: Date.now().toString() + Math.random(),
            amount: res.amount,
            type: res.type,
            walletId: data.wallets[0].id,
            categoryId: cat.id,
            date: new Date().toISOString().split('T')[0],
            note: res.note
          });
        }
      });
      setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', content: "Amallar bajarildi." }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', content: "Xatolik yuz berdi." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-white/5 bg-panel/50 backdrop-blur-md flex items-center gap-2"><Sparkles className="text-neon"/><h2 className="text-lg font-black">AI TAHLILCHI</h2></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-neon/10 border border-neon/20' : 'bg-panel border border-white/5'}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="p-2 animate-pulse text-[10px] text-gray-500 italic"><Loader2 className="animate-spin inline mr-2"/> O'ylayapman...</div>}
      </div>
      <div className="p-4 bg-background border-t border-white/5 mb-20 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-panel p-4 rounded-2xl outline-none border border-white/10 text-xs focus:border-neon" placeholder="Yozing..." />
        <button onClick={handleSend} className="p-4 bg-neon rounded-2xl text-black shadow-lg active:scale-95"><Send size={20}/></button>
      </div>
    </div>
  );
}
/* --- END OF AI PAGE --- */
