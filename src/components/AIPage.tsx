import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { AppData, Transaction, Category } from '../types';

interface Props {
  data: AppData;
  onAddTransaction: (tx: Transaction) => void;
}

interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; actionResult?: any;
}

export default function AIPage({ data, onAddTransaction }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: `Salom, ${data.profile.name}! Men sizning odatlaringizni o'rganib oldim. Xarajatlarni kiritishingiz mumkin.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agar kalit bo'lmasa, Yo'riqnoma (O'ZGARISHSIZ)
  if (!data.settings.aiApiKey) {
      return (
          <div className="h-full bg-[#0a0e17] flex flex-col items-center justify-center p-6 text-center animate-slideUp">
              <div className="w-20 h-20 bg-[#141e3c] rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]"><Sparkles size={40} className="text-[#00d4ff]"/></div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Yordamchini Yoqish</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs">Hisobchingiz ishlashi uchun unga "miya" (API Kalit) kerak.</p>
              <div className="w-full max-w-sm space-y-4">
                  <div className="bg-[#141e3c] p-4 rounded-2xl border border-white/5 text-left"><div className="flex items-center gap-2 mb-2"><span className="text-[#00d4ff] font-bold text-sm">Google Gemini (Tavsiya)</span></div><a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center justify-center gap-2 w-full py-2 bg-[#00d4ff]/10 text-[#00d4ff] rounded-lg text-xs font-bold hover:bg-[#00d4ff]/20 transition-colors"><ExternalLink size={14}/> Kalitni Olish</a></div>
                  <div className="bg-[#141e3c] p-4 rounded-2xl border border-white/5 text-left"><div className="flex items-center gap-2 mb-2"><span className="text-[#f55036] font-bold text-sm">Groq (Llama 3)</span></div><a href="https://console.groq.com/keys" target="_blank" className="flex items-center justify-center gap-2 w-full py-2 bg-[#f55036]/10 text-[#f55036] rounded-lg text-xs font-bold hover:bg-[#f55036]/20 transition-colors"><ExternalLink size={14}/> Kalitni Olish</a></div>
              </div>
          </div>
      );
  }

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // --- YANGI: AQLLI "PATTERN" QIDIRUVCHI ---
  // Bu funksiya foydalanuvchi yozgan so'zlar tarixda qaysi kategoriyada kelganini aniqlaydi
  const findSmartPatterns = (userInput: string): string => {
      const words = userInput.toLowerCase().split(' ').filter(w => w.length > 3); // 3 harfdan uzun so'zlarni olamiz
      const hints: string[] = [];

      words.forEach(word => {
          // Tarixdan shu so'z qatnashgan amallarni qidiramiz
          const match = data.transactions.find(t => t.note?.toLowerCase().includes(word));
          
          if (match) {
              const catName = data.categories.find(c => c.id === match.categoryId)?.name;
              const walletName = data.wallets.find(w => w.id === match.walletId)?.name;
              
              if (catName) {
                  hints.push(`- Tarixda "${word}" so'zi qatnashganda foydalanuvchi odatda "${catName}" kategoriyasini tanlagan.`);
              }
              if (walletName) {
                  hints.push(`- Odatda "${walletName}" hamyonidan to'lagan.`);
              }
          }
      });

      // Takroriy maslahatlarni olib tashlaymiz
      return Array.from(new Set(hints)).join('\n');
  };

  const getSystemContext = (userQuery: string) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const income = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const catList = data.categories.map(c => c.name).join(', ');
    const walletList = data.wallets.map(w => w.name).join(', ');

    // AQLLI MASLAHATLARNI CHAQIRAMIZ
    const smartHints = findSmartPatterns(userQuery);

    return `
      Sen aqlli moliyaviy yordamchisan. Hozirgi sana: ${today.toISOString().split('T')[0]}.
      
      MOLIYAVIY HOLAT:
      - Joriy oy kirim: ${income} UZS
      - Joriy oy chiqim: ${expense} UZS
      - Mavjud Hamyonlar: ${walletList}
      - Mavjud Kategoriyalar: ${catList}

      TARIXDAN O'RGANILGAN ODATLAR (BU JUDA MUHIM):
      ${smartHints || "Hozircha o'xshashlik topilmadi, umumiy mantiqqa tayan."}

      QOIDALAR:
      1. Agar foydalanuvchi amal qo'shmoqchi bo'lsa, yuqoridagi "ODATLAR"ga qarab eng mos kategoriyani tanla va JSON qaytar:
      {"action": "add", "amount": 1000, "type": "expense", "category": "...", "wallet": "...", "date": "YYYY-MM-DD", "note": "..."}
      
      2. Agar so'rov tarixiy ma'lumotni qidirish bo'lsa (masalan "qancha benzin", "kecha nima yedim"), JSON qaytar:
      {"action": "search", "query": "..."}

      3. Agar oddiy savol bo'lsa, qisqa va do'stona javob ber.
    `;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const apiKey = data.settings.aiApiKey;
    const provider = data.settings.aiProvider || 'gemini';

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        let aiText = "Tushunmadim";
        // Biz endi context ichiga userMsg.content ni ham berib yuboramiz, shunda pattern ishlaydi
        const systemPrompt = getSystemContext(userMsg.content);
        
        if (provider === 'gemini') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: systemPrompt + `\n\nFoydalanuvchi so'rovi: ${userMsg.content}` }] }] })
            });
            const result = await response.json();
            aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Xatolik yuz berdi.";
        } 
        else if (provider === 'groq') {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMsg.content }
                    ]
                })
            });
            const result = await response.json();
            aiText = result.choices?.[0]?.message?.content || "Xatolik yuz berdi.";
        }

        // --- JSON ISHLOV BERISH ---
        let processedMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: aiText };
        try {
            const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            if (cleanJson.startsWith('{')) {
                const actionData = JSON.parse(cleanJson);
                
                if (actionData.action === 'add') {
                    // Kategoriya va Hamyonni aniqlash (AI topa olmasa default)
                    const matchedCat = data.categories.find(c => c.name.toLowerCase().includes(actionData.category.toLowerCase())) || data.categories[0];
                    const matchedWallet = data.wallets.find(w => w.name.toLowerCase().includes(actionData.wallet?.toLowerCase())) || data.wallets[0];
                    
                    const newTx = { 
                        id: Date.now().toString(), 
                        amount: parseFloat(actionData.amount), 
                        type: actionData.type, 
                        walletId: matchedWallet.id, 
                        categoryId: matchedCat.id, 
                        date: actionData.date || new Date().toISOString().split('T')[0], 
                        note: actionData.note || 'AI orqali' 
                    };
                    
                    onAddTransaction(newTx);
                    processedMsg.content = `✅ Bajarildi! ${newTx.amount.toLocaleString()} so'm "${matchedCat.name}" kategoriyasiga qo'shildi.`;
                    processedMsg.actionResult = { type: 'success', tx: newTx };
                } 
                else if (actionData.action === 'search') {
                    const query = actionData.query.toLowerCase();
                    const results = data.transactions.filter(t => t.note?.toLowerCase().includes(query) || data.categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)).slice(0, 5);
                    processedMsg.content = `🔎 "${query}" bo'yicha topilgan natijalar:`;
                    processedMsg.actionResult = { type: 'search', items: results };
                }
            }
        } catch (e) { console.log("Text only response"); }

        setMessages(prev => [...prev, processedMsg]);
    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Xatolik: API kalitni tekshiring yoki internet yo'q." }]);
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
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#00d4ff]/10 text-white rounded-tr-none border border-[#00d4ff]/20' : 'bg-[#141e3c] text-gray-200 rounded-tl-none border border-white/5'}`}>{msg.content}</div>
                      {msg.actionResult?.type === 'success' && (<div className="bg-[#107c41]/20 border border-[#107c41]/50 p-3 rounded-xl flex items-center gap-3 animate-slideUp"><CheckCircle className="text-[#107c41]" size={20}/><div><p className="text-white text-xs font-bold">Muvaffaqiyatli saqlandi</p><p className="text-gray-400 text-[10px]">Summa: {msg.actionResult.tx.amount.toLocaleString()} | {msg.actionResult.tx.note}</p></div></div>)}
                      {msg.actionResult?.type === 'search' && (<div className="space-y-2 animate-slideUp">{msg.actionResult.items.map((t: any) => (<div key={t.id} className="bg-[#141e3c] p-2 rounded-lg border border-white/5 flex justify-between items-center"><span className="text-gray-400 text-xs">{t.date}</span><span className="text-white text-xs font-bold">{t.amount.toLocaleString()}</span></div>))}{msg.actionResult.items.length === 0 && <p className="text-gray-500 text-xs italic">Hech narsa topilmadi.</p>}</div>)}
                  </div>
              </div>
          ))}
          {loading && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#bb86fc] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[#0a0e17]"/></div><div className="p-3 rounded-2xl bg-[#141e3c] text-gray-400 text-xs rounded-tl-none italic">O'ylayapman...</div></div>)}
      </div>
      <div className="p-4 bg-[#0a0e17] border-t border-white/5"><div className="relative"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Masalan: Evosdan 50 mingga ovqat yedim..." className="w-full bg-[#141e3c] text-white pl-4 pr-12 py-4 rounded-2xl outline-none border border-white/10 focus:border-[#bb86fc] transition-colors text-sm"/><button onClick={handleSend} disabled={loading || !input.trim()} className="absolute right-2 top-2 p-2 bg-[#bb86fc] rounded-xl text-[#0a0e17] disabled:opacity-50 active:scale-95 transition-transform"><Send size={18} fill="#0a0e17"/></button></div></div>
    </div>
  );
}
