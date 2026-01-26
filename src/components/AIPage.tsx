import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Check, Brain, Wallet as WalletIcon, ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { AppData, TransactionType } from '../types';

interface AIPageProps {
  data: AppData;
  onAddTransaction: (transaction: any) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isError?: boolean;
  transactionData?: {
    amount: number;
    categoryId: string;
    subCategory?: string;
    walletId: string;
    type: TransactionType;
    date: string;
    note?: string;
  };
}

const DynamicIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} />;
};

export default function AIPage({ data, onAddTransaction }: AIPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Salom! Men sizning aqlli yordamchingizman. Har qanday xarajat yoki daromadni yozing, men ularni tahlil qilaman.\n\nMisol: 'Bugun tushlikka 45000 so'm ishlatdim' yoki 'Ish haqi tushdi 8 mln'",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processWithGemini = async (userText: string) => {
    const apiKey = data.aiSettings.apiKey;
    if (!apiKey) return { error: "Iltimos, avval Sozlamalar bo'limida Gemini API kalitini kiriting." };

    try {
      // Promptni shakllantirish (Podkategoriyalar bilan)
      const systemPrompt = `Sen professional buxgalter yordamchisisan.
Mavjud Kategoriyalar va ularning Podkategoriyalari:
${data.categories.map(c => `- ${c.name} (ID: ${c.id}, Turi: ${c.type}, Podkategoriyalar: ${c.subCategories?.join(', ') || 'yo\'q'})`).join('\n')}

Vazifang: Foydalanuvchi matnini tahlil qilib, FAQAT quyidagi JSON formatda javob qaytarish:
{
  "transactions": [
    {
      "amount": number,
      "categoryId": "kategoriya_id_sini_tanla",
      "subCategory": "podkategoriya_nomini_tanla_agar_mos_kelsa",
      "type": "income_yoki_expense",
      "note": "qisqa_izoh"
    }
  ],
  "reply": "O'zbekcha qisqa va do'stona javob"
}

Bugungi sana: ${new Date().toISOString().split('T')[0]}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nFoydalanuvchi: " + userText }] }]
        })
      });

      const result = await response.json();
      let text = result.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (err) {
      console.error(err);
      return { error: "AI bilan aloqada xatolik yuz berdi." };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const result = await processWithGemini(userMsg.text);
    setLoading(false);

    if (result.error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: result.error, sender: 'ai', isError: true }]);
      return;
    }

    if (result.transactions) {
      setMessages(prev => [...prev, { id: Date.now().toString() + '_r', text: result.reply, sender: 'ai' }]);
      result.transactions.forEach((tx: any, i: number) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + i,
          text: `${data.categories.find(c => c.id === tx.categoryId)?.name}: ${tx.amount.toLocaleString()} UZS`,
          sender: 'ai',
          transactionData: { ...tx, walletId: data.wallets[0].id, date: new Date().toISOString().split('T')[0] }
        }]);
      });
    }
  };

  const handleConfirm = (msg: Message) => {
    if (msg.transactionData) {
      onAddTransaction(msg.transactionData);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: m.text + " ✅", transactionData: undefined } : m));
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent pb-32 pt-safe">
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/20">
          <Brain size={24} />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg tracking-tight">AI Yordamchi</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl ${
              m.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20' 
                : 'glass-card text-gray-200 rounded-tl-none'
            } ${m.isError ? 'border-rose-500/50 bg-rose-500/10' : ''}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
              
              {m.transactionData && (
                <div className="mt-4 p-3 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <DynamicIcon name={data.categories.find(c => c.id === m.transactionData?.categoryId)?.icon || 'Circle'} size={14} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {m.transactionData.subCategory || 'Tranzaksiya'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{m.transactionData.date}</span>
                  </div>
                  <div className="text-xl font-black text-white">{m.transactionData.amount.toLocaleString()} <span className="text-xs text-gray-500">UZS</span></div>
                  <button onClick={() => handleConfirm(m)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-600/20">
                    <Check size={16} /> Tasdiqlash
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-card p-4 rounded-3xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-24 left-6 right-6">
        <div className="glass-card rounded-full p-1.5 flex items-center shadow-2xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="AI dan so'rang..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white px-5 text-sm placeholder-gray-500"
          />
          <button onClick={handleSend} disabled={!input.trim() || loading} className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-blue-600/30 disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
