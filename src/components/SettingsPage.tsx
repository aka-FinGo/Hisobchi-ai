import { User, Brain, LayoutGrid, Palette, Trash2, ChevronRight, Sparkles } from 'lucide-react';

export default function SettingsPage({ data, onAction }: any) {
  // Safe check: Agar ma'lumot kelmasa, loading ko'rsatadi
  if (!data || !data.profile) return <div className="p-10 text-center text-blue-400">Tizim yuklanmoqda...</div>;

  return (
    <div className="p-6 pb-32 space-y-8 overflow-y-auto h-full scrollbar-hide">
      <div className="text-center py-6">
        <div className="w-24 h-24 mx-auto rounded-[30px] p-1 bg-gradient-to-tr from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-4">
          <img src={data.profile.avatar} className="rounded-[26px] bg-gray-900" alt="Avatar" />
        </div>
        <h2 className="text-2xl font-black italic neon-text-blue">{data.profile.name}</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">aka_FinGo PRO User</p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Asosiy Sozlamalar</p>
        
        <div className="glass-neon rounded-[32px] overflow-hidden">
          <button onClick={() => onAction('edit-categories')} className="w-full p-5 flex items-center justify-between border-b border-white/5 active:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400"><LayoutGrid size={20}/></div>
              <span className="font-bold text-sm">Kategoriya va Podkategoriyalar</span>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </button>

          <button onClick={() => onAction('edit-ai')} className="w-full p-5 flex items-center justify-between active:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><Brain size={20}/></div>
              <span className="font-bold text-sm">AI Page Sozlamalari</span>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Ilova Dizayni</p>
        <div className="glass-neon rounded-[32px] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-500/20 rounded-xl text-pink-400"><Palette size={20}/></div>
              <span className="font-bold text-sm text-gray-300">Neon Chiroqlar Rejimi</span>
            </div>
            <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1 shadow-[0_0_10px_#2563eb]">
               <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
