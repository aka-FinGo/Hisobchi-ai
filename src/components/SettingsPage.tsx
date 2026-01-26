import { useState } from 'react';
import { 
  Settings, Wallet, CreditCard, DollarSign, FileDown, Share2, Database, 
  Brain, Sparkles, Trash2, ChevronRight, Plus, FolderOpen, Check, 
  ChevronDown, X 
} from 'lucide-react';
import { AppData, Wallet as WalletType, Currency, Category, TransactionType } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as XLSX from 'xlsx';
import * as Icons from 'lucide-react'; // Ikonkalar uchun

interface SettingsPageProps {
  data: AppData;
  onDataChange: () => void;
}

// Ikonka tanlash uchun modal komponenti
const IconPicker = ({ onSelect, onClose }: { onSelect: (icon: string) => void; onClose: () => void }) => {
  const iconList = ['ShoppingCart', 'Car', 'Home', 'Heart', 'Gamepad2', 'ShoppingBag', 'BookOpen', 'MoreHorizontal', 'Briefcase', 'TrendingUp', 'Gift', 'DollarSign', 'Coffee', 'Utensils', 'Smartphone', 'Wifi', 'Zap', 'Droplet', 'Tool', 'Truck', 'Plane', 'Globe', 'Music', 'Video', 'Camera', 'Smile', 'Award', 'Target', 'Umbrella'];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-fadeIn">
      <div className="bg-[#0f172a] rounded-3xl p-6 w-full max-w-sm border border-white/10 max-h-[60vh] overflow-y-auto scrollbar-hide shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold">Ikonka tanlang</h3>
            <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {iconList.map(iconName => {
             const Icon = (Icons as any)[iconName] || Icons.HelpCircle;
             return (
               <button key={iconName} onClick={() => onSelect(iconName)} className="p-3 bg-white/5 rounded-xl hover:bg-blue-500/20 flex justify-center transition-colors">
                 <Icon className="text-white" size={24} />
               </button>
             )
          })}
        </div>
      </div>
    </div>
  );
};

export default function SettingsPage({ data, onDataChange }: SettingsPageProps) {
  const [aiKey, setAiKey] = useState(data.aiSettings?.apiKey || '');
  const [loading, setLoading] = useState(false);

  // --- Kategoriya boshqaruvi uchun state ---
  const [activeCategoryTab, setActiveCategoryTab] = useState<TransactionType>('expense');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('MoreHorizontal');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const STORAGE_KEY_V2 = 'finance_app_data_v2';

  // --- YORDAMCHI FUNKSIYALAR ---
  const saveAndRefresh = (newData: AppData) => {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(newData));
    onDataChange();
  };

  // --- KATEGORIYA FUNKSIYALARI ---
  const handleAddSubCategory = (parentId: string) => {
    if (!newSubCategoryName.trim()) return;
    const updatedCategories = data.categories.map(cat => {
      if (cat.id === parentId) {
        return { ...cat, subCategories: [...(cat.subCategories || []), newSubCategoryName.trim()] };
      }
      return cat;
    });
    saveAndRefresh({ ...data, categories: updatedCategories });
    setNewSubCategoryName('');
  };

  const handleDeleteSubCategory = (parentId: string, subName: string) => {
     const updatedCategories = data.categories.map(cat => {
      if (cat.id === parentId && cat.subCategories) {
        return { ...cat, subCategories: cat.subCategories.filter(s => s !== subName) };
      }
      return cat;
    });
    saveAndRefresh({ ...data, categories: updatedCategories });
  };
  
  const handleAddCategory = () => {
      if(!newCatName.trim()) return;
      const newCategory: Category = {
          id: `c_${Date.now()}`,
          name: newCatName,
          icon: newCatIcon,
          type: activeCategoryTab,
          subCategories: []
      };
      saveAndRefresh({ ...data, categories: [...data.categories, newCategory] });
      setIsAddingCategory(false); setNewCatName(''); setNewCatIcon('MoreHorizontal');
  };

  const handleDeleteCategory = (id: string) => {
     if(!confirm("Diqqat! Agar bu kategoriyani o'chirsangiz, unga bog'liq eski tranzaksiyalarda kategoriya nomi ko'rinmay qolishi mumkin. Davom etasizmi?")) return;
     saveAndRefresh({ ...data, categories: data.categories.filter(c => c.id !== id) });
  }

  const handleSaveAI = () => {
    saveAndRefresh({
      ...data,
      aiSettings: { ...data.aiSettings, apiKey: aiKey },
    });
    alert('API kalit saqlandi!');
  };

    const exportToExcel = async () => {
    setLoading(true);
    try {
      const exportData = data.transactions.map(t => ({
        Sana: t.date,
        Tip: t.type === 'income' ? 'Kirim' : 'Chiqim',
        Kategoriya: data.categories.find(c => c.id === t.categoryId)?.name || 'O\'chirilgan',
        Podkategoriya: t.subCategory || '',
        Summa: t.amount,
        Valyuta: data.wallets.find(w => w.id === t.walletId)?.currency || '',
        Hamyon: data.wallets.find(w => w.id === t.walletId)?.name || 'O\'chirilgan',
        Izoh: t.note || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Hisobot");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      const fileName = `hisobot_${new Date().getTime()}.xlsx`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: wbout,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'Moliya Hisoboti',
        url: savedFile.uri,
        dialogTitle: 'Hisobotni ulashish',
      });

    } catch (error) {
      console.error('Export error:', error);
      alert('Eksportda xatolik! Ilova ruxsatlarini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  const DynamicIcon = ({ name, size=20, className="" }: {name:string, size?:number, className?:string}) => {
      const Icon = (Icons as any)[name] || Icons.HelpCircle;
      return <Icon size={size} className={className} />;
  }

  const filteredCategories = data.categories.filter(c => c.type === activeCategoryTab);

  return (
    <div className="p-6 pb-32 space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Sozlamalar</h2>

      {/* 1. AI Sozlamalari */}
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 text-blue-500/20"><Sparkles size={80} /></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Brain size={24} /></div>
          <h3 className="text-lg font-bold text-white">AI Yordamchi (Gemini)</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">Google Gemini API kalitini kiriting.</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            placeholder="API Key..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
          />
          <button onClick={handleSaveAI} className="bg-blue-600 px-6 rounded-xl font-medium text-white active:scale-95 transition-transform">Saqlash</button>
        </div>
      </div>

      {/* 2. Kategoriyalarni Boshqarish (PREMIUM FUNKSIYA) */}
      <div className="glass-card p-6 rounded-3xl">
         <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><FolderOpen size={24} /></div>
            <h3 className="text-lg font-bold text-white">Kategoriyalar va Podkategoriyalar</h3>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-white/5 rounded-xl mb-4">
             <button onClick={() => setActiveCategoryTab('expense')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${activeCategoryTab === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-gray-400'}`}>Chiqim</button>
             <button onClick={() => setActiveCategoryTab('income')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${activeCategoryTab === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'}`}>Kirim</button>
         </div>
        
         {/* Kategoriya Ro'yxati */}
         <div className="space-y-3">
             {filteredCategories.map(cat => (
                 <div key={cat.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 transition-all">
                     {/* Parent Kategoriya */}
                     <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10" onClick={() => setExpandedCategoryId(expandedCategoryId === cat.id ? null : cat.id)}>
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${cat.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                <DynamicIcon name={cat.icon} size={20} />
                             </div>
                             <span className="font-medium">{cat.name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-500">{cat.subCategories?.length || 0} ta tur</span>
                             {expandedCategoryId === cat.id ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronRight size={18} className="text-gray-400"/>}
                         </div>
                     </div>
                     
                     {/* Podkategoriyalar (Expandable) */}
                     {expandedCategoryId === cat.id && (
                         <div className="bg-black/20 p-4 border-t border-white/5 animate-fadeIn">
                             {/* Mavjud podkategoriyalar */}
                             <div className="flex flex-wrap gap-2 mb-4">
                                 {cat.subCategories?.length === 0 && <p className="text-gray-500 text-sm">Podkategoriya yo'q</p>}
                                 {cat.subCategories?.map(sub => (
                                     <div key={sub} className="bg-white/10 pl-3 pr-2 py-1.5 rounded-lg text-sm flex items-center gap-2 group">
                                         {sub}
                                         <button onClick={() => handleDeleteSubCategory(cat.id, sub)} className="text-gray-400 hover:text-rose-500 opacity-50 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                     </div>
                                 ))}
                             </div>
                             {/* Yangi podkategoriya qo'shish */}
                             <div className="flex gap-2 mb-4">
                                 <input type="text" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)} placeholder={`Yangi ${cat.name} turi...`} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"/>
                                 <button onClick={() => handleAddSubCategory(cat.id)} disabled={!newSubCategoryName.trim()} className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 disabled:opacity-50"><Plus size={18}/></button>
                             </div>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="w-full py-2 border border-rose-500/20 text-rose-500 text-sm flex items-center justify-center gap-2 rounded-lg hover:bg-rose-500/10 transition-colors"><Trash2 size={16}/> Kategoriyani o'chirish</button>
                         </div>
                     )}
                 </div>
             ))}
         </div>
         
         {/* Yangi Kategoriya Qo'shish Tugmasi */}
         {!isAddingCategory ? (
            <button onClick={() => setIsAddingCategory(true)} className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 flex items-center justify-center gap-2 font-medium transition-colors">
                <Plus size={18} /> Yangi Kategoriya Qo'shish
            </button>
         ) : (
            <div className="mt-4 bg-white/5 p-4 rounded-2xl border border-white/10 animate-fadeIn">
                <h4 className="text-white font-bold mb-3">Yangi {activeCategoryTab === 'expense' ? 'Chiqim' : 'Kirim'} Kategoriyasi</h4>
                <div className="flex gap-3 mb-3">
                    <button onClick={() => setShowIconPicker(true)} className="p-3 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors">
                        <DynamicIcon name={newCatIcon} size={24} className={activeCategoryTab === 'expense' ? 'text-rose-400' : 'text-emerald-400'} />
                    </button>
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Kategoriya nomi..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-blue-500"/>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => setIsAddingCategory(false)} className="flex-1 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10">Bekor qilish</button>
                    <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Saqlash</button>
                </div>
            </div>
         )}
      </div>
      
      {/* Excel Export */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer" onClick={exportToExcel}>
        <div className="flex items-center gap-4">
          <div className="bg-green-500/20 p-3 rounded-xl text-green-400"><FileDown size={24} /></div>
          <div>
            <h3 className="text-white font-bold">Excel ga yuklash</h3>
            <p className="text-gray-400 text-xs">{loading ? 'Yuklanmoqda...' : 'Barcha ma\'lumotlarni saqlash'}</p>
          </div>
        </div>
        <Share2 size={20} className="text-gray-400" />
      </div>
      
      {/* Data Reset */}
       <div className="glass-card p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer border border-rose-500/20 hover:bg-rose-500/10" onClick={() => {if(confirm("DIQQAT! Barcha ma'lumotlar, tranzaksiyalar va sozlamalar o'chiriladi. Rozimisiz?")) { localStorage.removeItem(STORAGE_KEY_V2); onDataChange(); }}}>
        <div className="flex items-center gap-4">
          <div className="bg-rose-500/20 p-3 rounded-xl text-rose-500"><Trash2 size={24} /></div>
          <div>
            <h3 className="text-white font-bold">Tozalash</h3>
            <p className="text-rose-400/70 text-xs">Zavod sozlamalariga qaytish</p>
          </div>
        </div>
      </div>
      
      {/* Icon Picker Modal */}
      {showIconPicker && <IconPicker onSelect={icon => {setNewCatIcon(icon); setShowIconPicker(false)}} onClose={() => setShowIconPicker(false)} />}

    </div>
  );
}
