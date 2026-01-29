import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Home, BarChart2, Plus, Sparkles, User, Lock, Shield, Fingerprint, Key, Camera, Server, Save, CheckCircle, FileText, LogOut, ChevronDown } from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, Transaction, Wallet, FilterState } from './types';

import HomePage from './components/HomePage';
import TransactionModal from './components/TransactionModal';
import WalletModal from './components/WalletModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import StatsPage from './components/StatsPage';
import AIPage from './components/AIPage';

// --- MODELLAR RO'YXATI (Siz bergan ro'yxat asosida) ---
const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Tavsiya)' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Experimental)' },
    { id: 'gemma-3-27b-it', name: 'Gemma 3 (27B)' },
    { id: 'gemma-3-12b-it', name: 'Gemma 3 (12B)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Stabil)' },
];

const GROQ_MODELS = [
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (17B) - New!' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS (120B)' },
    { id: 'groq/compound', name: 'Groq Compound' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 (70B) Versatile' },
    { id: 'llama3-8b-8192', name: 'Llama 3 (8B) - Juda Tez' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
];

// --- PROFIL SAHIFASI ---
const ProfilePage = ({ data, onUpdateSettings }: { data: AppData, onUpdateSettings: (s: any) => void }) => {
    // Local state for tracking changes
    const [settings, setSettings] = useState(data.settings);
    const [isChanged, setIsChanged] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Modellar ro'yxati
    const geminiModels = [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (v1alpha)' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Stable)' }
    ];

    const groqModels = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Compound)' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
    ];

    // Biror narsa o'zgarganda tekshirish
    const handleChange = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setIsChanged(JSON.stringify(newSettings) !== JSON.stringify(data.settings));
    };

    const handleSave = () => {
        onUpdateSettings(settings);
        setIsChanged(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0e17] animate-slideUp">
            <div className="p-6 pt-10 pb-4 shrink-0 bg-[#0a0e17] z-10 sticky top-0">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><User className="text-[#00d4ff]"/> Profil</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-32 scroll-area">
                {/* 1. AVATAR & NAME */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-4">
                        <img src={data.profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#141e3c] shadow-2xl object-cover"/>
                        <button className="absolute bottom-0 right-0 p-2 bg-[#00d4ff] rounded-full text-[#0a0e17] shadow-lg active:scale-95"><Camera size={16}/></button>
                    </div>
                    <input 
                        value={settings.userName} 
                        onChange={e => handleChange('userName', e.target.value)} 
                        className="bg-transparent text-center text-xl font-bold text-white outline-none border-b border-white/10 focus:border-[#00d4ff] pb-1 w-2/3" 
                        placeholder="Ismingiz"
                    />
                </div>

                {/* 2. AI SETTINGS */}
                <div className="mb-6">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">AI Provayder va Modellar</h3>
                    <div className="bg-[#141e3c] p-4 rounded-2xl border border-white/5 space-y-5">
                        
                        {/* Provider Selection Buttons */}
                        <div className="flex bg-[#0a0e17] rounded-xl p-1 border border-white/10">
                            <button 
                                onClick={() => handleChange('preferredProvider', 'gemini')} 
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settings.preferredProvider === 'gemini' ? 'bg-[#00d4ff] text-[#0a0e17]' : 'text-gray-500'}`}
                            >
                                Gemini
                            </button>
                            <button 
                                onClick={() => handleChange('preferredProvider', 'groq')} 
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settings.preferredProvider === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}
                            >
                                Groq
                            </button>
                        </div>

                        {/* Gemini Key & Model Select */}
                        <div className={`space-y-3 p-3 rounded-xl border ${settings.preferredProvider === 'gemini' ? 'border-[#00d4ff]/30 bg-[#00d4ff]/5' : 'border-white/5 opacity-50'}`}>
                            <p className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-wider">Google Gemini</p>
                            <input 
                                type="text" 
                                placeholder="Gemini API Key" 
                                value={settings.geminiKey || ''} 
                                onChange={e => handleChange('geminiKey', e.target.value)} 
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 text-xs font-mono"
                            />
                            <select 
                                value={settings.geminiModel || 'gemini-2.5-flash'} 
                                onChange={e => handleChange('geminiModel', e.target.value)}
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 text-xs"
                            >
                                {geminiModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {/* Groq Key & Model Select */}
                        <div className={`space-y-3 p-3 rounded-xl border ${settings.preferredProvider === 'groq' ? 'border-[#f55036]/30 bg-[#f55036]/5' : 'border-white/5 opacity-50'}`}>
                            <p className="text-[#f55036] text-[10px] font-bold uppercase tracking-wider">Groq Compound</p>
                            <input 
                                type="text" 
                                placeholder="Groq API Key" 
                                value={settings.groqKey || ''} 
                                onChange={e => handleChange('groqKey', e.target.value)} 
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 text-xs font-mono"
                            />
                            <select 
                                value={settings.groqModel || 'llama-3.3-70b-versatile'} 
                                onChange={e => handleChange('groqModel', e.target.value)}
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 text-xs"
                            >
                                {groqModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {/* Custom Prompt */}
                        <div>
                            <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><FileText size={14} className="text-yellow-500"/> Shaxsiy Yo'riqnoma</p>
                            <textarea 
                                rows={2} 
                                value={settings.customPrompt || ''} 
                                onChange={e => handleChange('customPrompt', e.target.value)}
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl outline-none border border-white/10 text-xs resize-none"
                                placeholder="Masalan: Menga har doim o'zbek tilida va hazil bilan javob ber..."
                            />
                        </div>
                    </div>
                </div>

                {/* 3. SECURITY */}
                <div className="mb-6">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Xavfsizlik</h3>
                    <div className="bg-[#141e3c] rounded-2xl overflow-hidden border border-white/5 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg"><Lock size={18} className="text-[#00d4ff]"/></div><span className="text-white text-sm font-bold">PIN Kod</span></div>
                            <button onClick={() => handleChange('pinCode', settings.pinCode ? null : '0000')} className={`w-10 h-6 rounded-full relative transition-colors ${settings.pinCode ? 'bg-[#00d4ff]' : 'bg-gray-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.pinCode ? 'left-5' : 'left-1'}`}></div>
                            </button>
                        </div>
                        {settings.pinCode && (
                            <input 
                                type="number" 
                                value={settings.pinCode} 
                                onChange={e => handleChange('pinCode', e.target.value.slice(0,4))} 
                                className="w-full bg-[#0a0e17] text-white p-3 rounded-xl text-center tracking-[8px] font-mono outline-none border border-[#00d4ff]/30"
                            />
                        )}
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <button 
                    onClick={handleSave} 
                    disabled={!isChanged}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-lg mb-10 
                        ${isSaved ? 'bg-[#107c41] text-white' : isChanged ? 'bg-[#00d4ff] text-[#0a0e17]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                    {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>}
                    {isSaved ? "SAQLANDI" : "SAQLASH"}
                </button>
            </div>
        </div>
    );
};
// --- LOCK SCREEN ---
const LockScreen = ({ correctPin, useBiometrics, onUnlock }: { correctPin: string, useBiometrics: boolean, onUnlock: () => void }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const checkBiometric = async () => {
        if (!useBiometrics) return;
        try {
            const result = await NativeBiometric.isAvailable();
            if (result.isAvailable) {
                await NativeBiometric.verifyIdentity({
                    reason: "Hisobchi AI",
                    title: "Kirish",
                    subtitle: "Tasdiqlang",
                    description: "Barmoq izi"
                });
                onUnlock();
            }
        } catch (e) { console.log("Biometric canceled"); }
    };

    useEffect(() => { if(useBiometrics) checkBiometric(); }, []);

    const handleInput = (val: string) => {
        const newVal = input + val;
        setInput(newVal);
        if (newVal.length === correctPin.length) {
            if (String(newVal) === String(correctPin)) onUnlock();
            else { setError(true); setTimeout(() => { setInput(''); setError(false); }, 500); }
        }
    }

    return (
        <div className="fixed inset-0 z-[300] bg-[#05070a] flex flex-col items-center justify-center animate-slideUp">
            <div className="p-4 bg-[#141e3c] rounded-full mb-8" onClick={checkBiometric}><Lock size={32} className="text-[#00d4ff]"/></div>
            <h2 className="text-white font-bold text-xl mb-8">Parolni kiriting</h2>
            <div className="flex gap-4 mb-10">{[...Array(correctPin.length)].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border border-[#00d4ff] ${i < input.length ? 'bg-[#00d4ff]' : ''} ${error ? 'animate-bounce bg-red-500 border-red-500' : ''}`}></div>))}</div>
            <div className="grid grid-cols-3 gap-6">{[1,2,3,4,5,6,7,8,9].map(n => (<button key={n} onClick={() => handleInput(n.toString())} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl active:scale-90">{n}</button>))}<div/><button onClick={() => handleInput('0')} className="w-16 h-16 rounded-full bg-[#141e3c] text-white font-bold text-xl active:scale-90">0</button><button onClick={() => setInput(input.slice(0,-1))} className="w-16 h-16 rounded-full text-gray-500 flex items-center justify-center active:scale-90">⬅️</button></div>
            {useBiometrics && (<button onClick={checkBiometric} className="mt-8 text-[#00d4ff] text-sm font-bold flex items-center gap-2 animate-pulse"><Fingerprint size={20}/> Barmoq izi bilan kirish</button>)}
        </div>
    )
}
type TabType = 'home' | 'stats' | 'ai' | 'profile';

function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [historyStack, setHistoryStack] = useState<TabType[]>([]);
  
  const [isLocked, setIsLocked] = useState(!!(data.settings?.pinCode && data.settings.pinCode.length === 4));

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'wallet' | 'tx' } | null>(null);
  const [statsFilter, setStatsFilter] = useState<FilterState | null>(null);

  useEffect(() => { saveData(data); }, [data]);

  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      if (isLocked) return;
      if (isTxModalOpen || isWalletModalOpen || detailTx || contextMenu) {
         setIsTxModalOpen(false); setIsWalletModalOpen(false); setDetailTx(null); setContextMenu(null);
         return;
      }
      if (historyStack.length > 0) {
         const prev = historyStack[historyStack.length - 1];
         setHistoryStack(p => p.slice(0, -1)); setActiveTab(prev);
         return;
      }
      if (activeTab !== 'home') { setActiveTab('home'); return; }
      CapacitorApp.exitApp();
    });
  }, [isTxModalOpen, isWalletModalOpen, detailTx, contextMenu, historyStack, activeTab, isLocked]);

  const refreshData = () => { setData(loadData()); };
  const handleWalletSave = (wallet: Wallet) => { if (editingWallet) setData({ ...data, wallets: data.wallets.map(w => w.id === wallet.id ? wallet : w) }); else setData({ ...data, wallets: [...data.wallets, wallet] }); setIsWalletModalOpen(false); setEditingWallet(null); };
  const handleTransactionSave = (txData: Transaction) => { let newTx = [...data.transactions]; let newW = [...data.wallets]; if (editingTx) { const old = data.transactions.find(t => t.id === editingTx.id); if(old) { newW = newW.map(w => w.id === old.walletId ? { ...w, balance: w.balance + (old.type === 'income' ? -old.amount : old.amount) } : w); newTx = newTx.filter(t => t.id !== editingTx.id); } } const finalTx = { ...txData, id: txData.id || Date.now().toString() }; newTx.push(finalTx); newW = newW.map(w => w.id === finalTx.walletId ? { ...w, balance: w.balance + (finalTx.type === 'income' ? finalTx.amount : -finalTx.amount) } : w); setData({ ...data, transactions: newTx, wallets: newW }); setIsTxModalOpen(false); setEditingTx(null); setDetailTx(null); };
  const handleDeleteTx = (id: string) => { if(!confirm("O'chirilsinmi?")) return; const tx = data.transactions.find(t => t.id === id); if(!tx) return; const newW = data.wallets.map(w => w.id === tx.walletId ? { ...w, balance: w.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : w); setData({ ...data, transactions: data.transactions.filter(t => t.id !== id), wallets: newW }); setContextMenu(null); setDetailTx(null); };
  const handleDeleteWallet = (id: string) => { if(!confirm("Hamyon o'chirilsinmi?")) return; setData({ ...data, wallets: data.wallets.filter(w => w.id !== id), transactions: data.transactions.filter(t => t.walletId !== id) }); setContextMenu(null); };
  const handleJumpToFilter = (filter: FilterState) => { setStatsFilter(filter); setDetailTx(null); setActiveTab('stats'); };

  if (isLocked && data.settings?.pinCode) return <LockScreen correctPin={data.settings.pinCode} useBiometrics={data.settings.useBiometrics} onUnlock={() => setIsLocked(false)} />;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0e17] font-['Plus_Jakarta_Sans'] select-none text-[#e0e0ff]" onClick={() => setContextMenu(null)}>
      <div className="flex-1 overflow-hidden relative"><div className="h-full w-full">
          {activeTab === 'home' && <HomePage data={data} onNavigate={(p) => { setHistoryStack(prev => [...prev, activeTab]); setActiveTab(p as any); }} onTransactionClick={setDetailTx} onContextMenu={(e, i, t) => setContextMenu({ x: e.clientX, y: e.clientY, item: i, type: t })} onAddWallet={() => { setEditingWallet(null); setIsWalletModalOpen(true); }} onRefresh={refreshData}/>}
          {activeTab === 'stats' && <StatsPage data={data} initialFilter={statsFilter} onClearFilter={() => setStatsFilter(null)} onTxClick={setDetailTx} />}
          {activeTab === 'ai' && <AIPage data={data} onAddTransaction={handleTransactionSave} />}
          {activeTab === 'profile' && <ProfilePage data={data} onUpdateSettings={(s) => setData({...data, settings: s})} />}
      </div></div>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl pb-5 pt-3 border-t border-white/5"><div className="flex justify-between items-center px-6"><button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Home size={24}/></button><button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><BarChart2 size={24}/></button><div className="relative -top-7"><button onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }} className="w-16 h-16 rounded-full bg-[#141e3c] border border-[#00d4ff]/40 text-[#00d4ff] flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.3)] active:scale-95 transition-transform"><Plus size={32} strokeWidth={3} /></button></div><button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><User size={24}/></button><button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-[#00d4ff]' : 'text-gray-600'}`}><Sparkles size={24}/></button></div></div>
      <WalletModal isOpen={isWalletModalOpen} onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }} onSave={handleWalletSave} initialData={editingWallet} />
      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSave={handleTransactionSave} categories={data.categories} wallets={data.wallets} allTransactions={data.transactions} initialData={editingTx} onAddCategory={(c) => setData({...data, categories: [...data.categories, c]})} onUpdateCategories={(u) => setData({...data, categories: u})} settings={data.settings}/>
      <TransactionDetailModal isOpen={!!detailTx} onClose={() => setDetailTx(null)} transaction={detailTx} category={data.categories.find(c => c.id === detailTx?.categoryId)} wallet={data.wallets.find(w => w.id === detailTx?.walletId)} onEdit={(tx) => { setDetailTx(null); setEditingTx(tx); setIsTxModalOpen(true); }} onDelete={handleDeleteTx} onFilter={handleJumpToFilter} />
      {contextMenu && (<div className="absolute bg-[#141e3c] border border-white/10 rounded-2xl p-2 w-44 shadow-2xl z-[150] animate-slideUp" style={{ top: contextMenu.y - 100, left: Math.min(contextMenu.x - 20, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}><button onClick={() => { if(contextMenu.type === 'tx') { setEditingTx(contextMenu.item); setIsTxModalOpen(true); } if(contextMenu.type === 'wallet') { setEditingWallet(contextMenu.item); setIsWalletModalOpen(true); } setContextMenu(null); }} className="w-full text-left px-3 py-3 text-white text-sm font-bold hover:bg-white/5 rounded-xl">✏️ Tahrirlash</button><div className="h-[1px] bg-white/5 my-1"></div><button onClick={() => { if(contextMenu.type === 'tx') handleDeleteTx(contextMenu.item.id); else handleDeleteWallet(contextMenu.item.id); }} className="w-full text-left px-3 py-3 text-rose-500 text-sm font-bold hover:bg-rose-500/10 rounded-xl">🗑️ O'chirish</button></div>)}
    </div>
  );
}
export default App;
