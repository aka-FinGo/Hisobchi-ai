import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Category, Wallet, TransactionType } from '../types';

interface AIPageProps {
  categories: Category[];
  wallets: Wallet[];
  onAddTransaction: (transaction: {
    amount: number;
    categoryId: string;
    walletId: string;
    type: TransactionType;
    date: string;
    note?: string;
  }) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  transaction?: {
    amount: number;
    categoryId: string;
    walletId: string;
    type: TransactionType;
    date: string;
    note?: string;
  };
}

export default function AIPage({ categories, wallets, onAddTransaction }: AIPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Salom! Men sizning moliyaviy yordamchingizman. Tranzaksiyani oddiy so\'zlar bilan yozing, masalan: "Bugun 50000 so\'mga non oldim" yoki "Ish haqi 5000000"',
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');

  const parseTransaction = (text: string) => {
    const lowerText = text.toLowerCase();

    const amountMatch = text.match(/(\d+(?:[\s,]\d+)*)/);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/[\s,]/g, ''));

    let type: TransactionType = 'expense';
    const incomeKeywords = ['ish haqi', 'maosh', 'daromad', 'kirim', 'oldim', 'keldi', 'tushdi'];
    if (incomeKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'income';
    }

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');
    const relevantCategories = type === 'expense' ? expenseCategories : incomeCategories;

    let categoryId = relevantCategories[0]?.id;

    if (type === 'expense') {
      if (lowerText.includes('non') || lowerText.includes('ovqat') || lowerText.includes('yedim')) {
        categoryId = categories.find(c => c.name === 'Oziq-ovqat')?.id || categoryId;
      } else if (lowerText.includes('taksi') || lowerText.includes('transport') || lowerText.includes('benzin')) {
        categoryId = categories.find(c => c.name === 'Transport')?.id || categoryId;
      } else if (lowerText.includes('kiyim') || lowerText.includes('kechak')) {
        categoryId = categories.find(c => c.name === 'Kiyim-kechak')?.id || categoryId;
      }
    } else {
      if (lowerText.includes('ish') || lowerText.includes('maosh')) {
        categoryId = categories.find(c => c.name === 'Ish haqi')?.id || categoryId;
      } else if (lowerText.includes('biznes')) {
        categoryId = categories.find(c => c.name === 'Biznes')?.id || categoryId;
      }
    }

    const walletId = wallets[0]?.id;
    const date = new Date().toISOString().split('T')[0];

    return {
      amount,
      categoryId,
      walletId,
      type,
      date,
      note: text,
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);

    const transaction = parseTransaction(input);

    if (transaction) {
      const category = categories.find(c => c.id === transaction.categoryId);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `✅ Tushundim! ${transaction.type === 'income' ? 'Daromad' : 'Chiqim'}: ${transaction.amount.toLocaleString()} so'm (${category?.name}). Saqlashni xohlaysizmi?`,
        sender: 'ai',
        transaction,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } else {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Kechirasiz, tushunmadim. Iltimos, summani ko\'rsating. Masalan: "50000 so\'mga non oldim"',
        sender: 'ai',
      };
      setMessages((prev) => [...prev, aiResponse]);
    }

    setInput('');
  };

  const handleConfirm = (message: Message) => {
    if (message.transaction) {
      onAddTransaction(message.transaction);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: '✅ Tranzaksiya saqlandi!',
          sender: 'ai',
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={24} className="text-blue-500" />
          AI Yordamchi
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              {message.transaction && (
                <button
                  onClick={() => handleConfirm(message)}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg font-medium active:scale-95 transition-all"
                >
                  Saqlash
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700 pb-24">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tranzaksiyani yozing..."
            className="flex-1 bg-gray-800 text-white p-4 rounded-full border border-gray-700 focus:border-blue-500 focus:outline-none"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white p-4 rounded-full active:scale-95 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
