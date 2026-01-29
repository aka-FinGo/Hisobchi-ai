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
}
