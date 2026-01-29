/* --- MODELLAR RO'YXATI --- */
const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
    { id: 'gemma-3-27b-it', name: 'Gemma 3 (27B)' },
    { id: 'gemma-3-12b-it', name: 'Gemma 3 (12B)' },
    { id: 'gemma-3-4b-it', name: 'Gemma 3 (4B)' },
    { id: 'gemini-robotic-er-1.5-preview', name: 'Gemini Robotics ER 1.5' }
];

const GROQ_MODELS = [
    { id: 'groq/compound', name: 'Groq Compound' },
    { id: 'groq/compound-mini', name: 'Groq Compound Mini' },
    { id: 'meta-llama/llama-4-maverick-17b', name: 'Llama 4 Maverick (17B)' },
    { id: 'meta-llama/llama-4-scout-17b', name: 'Llama 4 Scout (17B)' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS (120B)' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS (20B)' },
    { id: 'qwen/qwen3-32b', name: 'Qwen 3 (32B)' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' }
];

/* --- PROFIL SAHIFASI --- */
const ProfilePage = ({ data, onUpdateSettings }: any) => {
    const [settings, setSettings] = useState(data.settings);
    const [isChanged, setIsChanged] = useState(false);

    // START: Ma'lumot o'zgarishini kuzatish
    const handleUpdate = (key: string, val: any) => {
        const next = { ...settings, [key]: val };
        setSettings(next);
        setIsChanged(JSON.stringify(next) !== JSON.stringify(data.settings));
    };

    return (
        <div className="scroll-area p-6 space-y-6">
            <h2 className="text-2xl font-black neon-text-blue">PROFIL SOZLAMALARI</h2>
            
            <div className="bg-[#141e3c] p-5 rounded-[24px] border border-white/5 space-y-4">
                {/* Provayder tanlash */}
                <div className="flex bg-[#0a0e17] p-1 rounded-xl">
                    <button onClick={() => handleUpdate('preferredProvider', 'gemini')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${settings.preferredProvider === 'gemini' ? 'bg-[#00d4ff] text-black' : 'text-gray-500'}`}>Gemini</button>
                    <button onClick={() => handleUpdate('preferredProvider', 'groq')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${settings.preferredProvider === 'groq' ? 'bg-[#f55036] text-white' : 'text-gray-500'}`}>Groq</button>
                </div>

                {/* Gemini Modeli */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-400 uppercase">Gemini Model</label>
                    <select value={settings.geminiModel} onChange={e => handleUpdate('geminiModel', e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 outline-none text-sm">
                        {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                {/* Groq Modeli */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-red-400 uppercase">Groq Model</label>
                    <select value={settings.groqModel} onChange={e => handleUpdate('groqModel', e.target.value)} className="w-full bg-[#0a0e17] text-white p-3 rounded-xl border border-white/10 outline-none text-sm">
                        {GROQ_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            <button 
                disabled={!isChanged} 
                onClick={() => { onUpdateSettings(settings); setIsChanged(false); }}
                className={`w-full py-4 rounded-2xl font-black transition-all ${isChanged ? 'bg-[#00d4ff] text-black shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'bg-gray-800 text-gray-500 opacity-50'}`}
            >
                SOZLAMALARNI SAQLASH
            </button>
        </div>
    );
};
/* --- END OF PROFILE PAGE --- */
