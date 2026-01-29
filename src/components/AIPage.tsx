/**
 * START: AIPAGE.TSX
 * Gemini 2.5/3 Flash (v1alpha) va Groq Compound modellariga integratsiya.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ListChecks, PieChart } from 'lucide-react';
import { AppData, Transaction } from '../types';

export default function AIPage({ data, onAddTransaction }: { data: AppData; onAddTransaction: (tx: Transaction) => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // Funksiya: AI uchun moliyaviy kontekstni tayyorlash
  const getSystemPrompt = () => {
    return `
      System: Professional Financial AI. 
      Format: Respond strictly in JSON array of objects. 
      Wallets: ${data.wallets.map(w => w.name).join(', ')}.
      Categories: ${data.categories.map(c => c.name).join(', ')}.
      Actions: 
      - "add": {"action": "add", "amount": 1000, "type": "expense"|"income", "category": "...", "note": "..."}
      - "analysis": {"action": "analysis", "text": "..."}
    `;
  };

  // Funksiya: API chaqiruvi (Gemini v1alpha & Groq)
  const callAI = async (provider: string, key: string, userMsg: string) => {
    const MODEL = provider === 'gemini' ? data.settings.geminiModel : data.settings.groqModel;
    
    try {
        if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1alpha/models/${MODEL}:generateContent?key=${key}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: getSystemPrompt() + "\n\nUser: " + userMsg }] }] })
            });
            const json = await res.json();
            return json.candidates[0].content.parts[0].text;
        } else {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [{ role: "system", content: getSystemPrompt() }, { role: "user", content: userMsg }],
                    response_format: { type: "json_object" }
                })
            });
            const json = await res.json();
            return json.choices[0].message.content;
        }
    } catch (e) { throw e; }
  };

  // Funksiya: Xabarni yuborish va natijani tahlil qilish
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const provider = data.settings.preferredProvider;
        const key = provider === 'gemini' ? data.settings.geminiKey : data.settings.groqKey;
        
        const rawResponse = await callAI(provider, key || '', userMsg.content);
        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const results = JSON.parse(cleanJson.startsWith('[') ? cleanJson : `[${cleanJson}]`);

        let assistantText = "";
        let actionRes = null;

        results.forEach((res: any) => {
            if (res.action === 'add') {
                const cat = data.categories.find(c => c.name.toLowerCase().includes(res.category.toLowerCase())) || data.categories[0];
                const wal = data.wallets[0]; // Simple logic
                onAddTransaction({
                    id: Date.now().toString() + Math.random(),
                    amount: res.amount,
                    type: res.type,
                    walletId: wal.id,
                    categoryId: cat.id,
                    date: new Date().toISOString().split('T')[0],
                    note: res.note
                });
                assistantText += `✅ ${res.amount.toLocaleString()} UZS qo'shildi. `;
                actionRes = { type: 'success' };
            } else if (res.action === 'analysis') {
                assistantText += res.text;
                actionRes = { type: 'analysis' };
            }
        });

        setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', content: assistantText, actionResult: actionRes }]);
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', content: "⚠️ Xatolik: API javobini o'qib bo'lmadi." }]);
    } finally { setLoading(false); }
  };

  /** START: RENDER QISMI **/
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-white/5 bg-panel/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Sparkles className="text-neon" size={20}/> AI TAHLILCHI</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area">
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-neon' : 'bg-purple-500'}`}>
                      {msg.role === 'user' ? <User size={16} className="text-black"/> : <Bot size={16} className="text-black"/>}
                  </div>
                  <div className="max-w-[85%] space-y-2">
                      <div className={`p-4 rounded-[20px] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-neon/10 text-white border border-neon/20 rounded-tr-none' : 'bg-panel text-gray-200 border border-white/5 rounded-tl-none'}`}>
                          {msg.content}
                      </div>
                      {msg.actionResult?.type === 'success' && <div className="text-[10px] text-green-400 font-bold flex items-center gap-1"><ListChecks size={12}/> AMAL SAQLANDI</div>}
                      {msg.actionResult?.type === 'analysis' && <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1"><PieChart size={12}/> TAHLIL TAYYOR</div>}
                  </div>
              </div>
          ))}
          {loading && <div className="flex gap-2 p-2 text-gray-500 text-[10px] italic animate-pulse"><Loader2 size={12} className="animate-spin" /> AI tahlil qilmoqda...</div>}
      </div>

      <div className="p-4 bg-background border-t border-white/5">
          <div className="relative">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Xarajatlarni yozing yoki tahlil so'rang..." className="w-full bg-panel text-white pl-4 pr-12 py-5 rounded-[22px] outline-none border border-white/10 text-xs focus:border-neon transition-all" />
              <button onClick={handleSend} disabled={loading} className="absolute right-2 top-2 p-3 bg-neon rounded-xl text-black active:scale-95 disabled:opacity-50 transition-all"><Send size={18}/></button>
          </div>
      </div>
    </div>
  );
  /** END: RENDER QISMI **/
}
/** END: AIPAGE.TSX **/
