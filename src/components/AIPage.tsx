import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertTriangle, Check, X } from 'lucide-react';
import { Category, Wallet, TransactionType, AppData } from '../types';

interface AIPageProps {
  data: AppData; // Sozlamalar va ma'lumotlarni olish uchun
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
    walletId: string;
    type: TransactionType;
    date: string;
    note?: string;
    subCategory?: string;
  };
}

export default function AIPage({ data, onAddTransaction }: AIPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Salom! Men sizning moliyaviy yordamchingizman. Xarajat yoki daromadni erkin yozing. Misol: "Bozordan 50 mingga go\'sht, 12 mingga non oldim"',
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Avtomatik pastga tushirish (Scroll)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- GEMINI API BILAN ALOQA ---
  const processWithGemini = async (userText: string) => {
    const apiKey = data.aiSettings.apiKey;
    
    if (!apiKey) {
      return {
        text: "Iltimos, avval Sozlamalar bo'limiga o'tib, Google Gemini API kalitini kiriting.",
        isError: true
      };
    }

    try {
      // 1. Promptni tayyorlash (Juda muhim qism!)
      const systemPrompt = `
        Sen professional buxgaltersan. Foydalanuvchi o'zbek tilida xarajat yoki kirim haqida yozadi.
        Sening vazifang: Matnni tahlil qilib, quyidagi JSON formatda javob qaytarish.
        Boshqa hech qanday so'z yozma, faqat JSON.
        
        Mavjud Kategoriyalar:
        ${data.categories.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.type})`).join('\n')}
        
        Mavjud Hamyonlar:
        ${data.wallets.map(w => `- ${w.name} (ID: ${w.id}, Currency: ${w.currency})`).join('\n')}
        
        Bugungi sana: ${new Date().toISOString().split('T')[0]}
        
        Javob strukturasi (JSON):
        {
          "transactions": [
            {
              "amount": number (faqat raqam),
              "categoryId": string (yuqoridagi ID lardan biri),
              "walletId": string (yuqoridagi ID lardan biri, agar aniqlab bo'lmasa default 'w1'),
              "type": "income" yoki "expense",
              "date": "YYYY-MM-DD",
              "note": string (qisqa izoh),
              "subCategory": string (agar aniq mahsulot nomi bo'lsa)
            }
          ],
          "reply": string (Foydalanuvchiga qisqa javob, masalan: "Tushundim, 2 ta tranzaksiya tayyorladim")
        }
        
        Agar matnda bir nechta xarajat bo'lsa (masalan: "non 5000, go'sht 60000"), ularni alohida obyekt qilib array ichida qaytar.
      `;

      // 2. API ga so'rov yuborish
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + "\n\nFoydalanuvchi yozdi: " + userText }]
          }]
        })
      });

      const result = await response.json();
      
      if (!result.candidates || !result.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("API dan noto'g'ri javob keldi");
      }

      // 3. Javobni tozalash va parse qilish
      let textResponse = result.candidates[0].content.parts[0].text;
      // Ba'zan AI markdown ```json ... ``` qo'shib yuboradi, shuni tozalaymiz
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(textResponse);
      return parsedData;

    } catch (error) {
      console.error(error);
      return {
        text: "Xatolik yuz berdi. Internetni yoki API kalitni tekshiring.",
        isError: true
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // AI ga yuborish
    const result = await processWithGemini(userMessage.text);

    setLoading(false);

    if (result.isError) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: result.text,
        sender: 'ai',
        isError: true
      }]);
      return;
    }

    // Agar tranzaksiyalar bo'lsa, har biri uchun alohida xabar chiqaramiz
    if (result.transactions && result.transactions.length > 0) {
      // Avval umumiy javob
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: result.reply || "Mana topganlarim:",
        sender: 'ai'
      }]);

      // Keyin har bir tranzaksiya kartochkasi
      result.transactions.forEach((tx: any, index: number) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + index,
            text: `${data.categories.find(c => c.id === tx.categoryId)?.name || 'Kategoriya'}: ${tx.amount.toLocaleString()} so'm`,
            sender: 'ai',
            transactionData: tx
          }]);
        }, index * 500); // Ketma-ket chiqishi uchun ozgina delay
      });
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Kechirasiz, tranzaksiyani aniqlay olmadim. Qayta urinib ko'ring.",
        sender: 'ai'
      }]);
    }
  };

  const handleConfirmTransaction = (messageId: string, txData: any) => {
    onAddTransaction(txData);
    // Tasdiqlangandan keyin xabarni o'zgartiramiz
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, text: m.text + " ✅ (Saqlandi)", transactionData: undefined };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20 pt-safe">
      <div className="p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Sparkles className="text-blue-500" /> AI Yordamchi
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : message.isError 
                    ? 'bg-red-900/50 text-red-200 border border-red-800'
                    : 'bg-gray-800 text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
              
              {/* Agar bu xabar tranzaksiya taklifi bo'lsa */}
              {message.transactionData && (
                <div className="mt-3 bg-gray-900/50 rounded-xl p-3 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">
                      {data.wallets.find(w => w.id === message.transactionData?.walletId)?.name}
                    </span>
                    <span className="text-xs text-gray-400">{message.transactionData.date}</span>
                  </div>
                  <div className="font-bold text-white text-lg mb-1">
                    {message.transactionData.amount.toLocaleString()} so'm
                  </div>
                  <div className="text-xs text-gray-400 italic mb-3">
                    {message.transactionData.note || message.transactionData.subCategory}
                  </div>
                  
                  <button
                    onClick={() => handleConfirmTransaction(message.id, message.transactionData)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Check size={16} /> Tasdiqlash
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl p-4 rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800 fixed bottom-[80px] left-0 right-0">
        <div className="flex gap-2 max-w-screen-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Xarajatni yozing..."
            className="flex-1 bg-gray-800 text-white px-5 py-3 rounded-full border border-gray-700 focus:border-blue-500 focus:outline-none placeholder-gray-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Sparkles size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
