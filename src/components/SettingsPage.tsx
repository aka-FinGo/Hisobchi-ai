import { User, Shield, Brain, Palette, PlusCircle, LayoutGrid } from 'lucide-react';

export default function ProfilePage({ data, onAction }: { data: AppData, onAction: (type: string) => void }) {
  return (
    <div className="p-6 pb-32 space-y-6 overflow-y-auto h-full scrollbar-hide">
      <div className="text-center py-8">
        <div className="w-24 h-24 mx-auto neon-border-blue rounded-3xl p-1 mb-4 shadow-[0_0_25px_rgba(0,242,255,0.3)]">
          <img src={data.profile.avatar} className="rounded-2xl" alt="Profile" />
        </div>
        <h3 className="text-xl font-black text-white italic">{data.profile.name}</h3>
        <p className="text-xs text-blue-500 font-bold tracking-widest uppercase">Senior User / aka_FinGo</p>
      </div>

      <div className="space-y-4">
        {/* Settings Groups */}
        <section className="space-y-2">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Moliya va Tizim</p>
          <div className="glass-neon rounded-3xl overflow-hidden">
            <button onClick={() => onAction('edit-categories')} className="w-full p-4 flex items-center justify-between border-b border-white/5 active:bg-white/5">
              <div className="flex items-center gap-4">
                <LayoutGrid className="text-purple-500" size={20} />
                <span className="text-sm font-bold">Kategoriyalar va Podkategoriyalar</span>
              </div>
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <button onClick={() => onAction('edit-ai')} className="w-full p-4 flex items-center justify-between active:bg-white/5">
              <div className="flex items-center gap-4">
                <Brain className="text-blue-500" size={20} />
                <span className="text-sm font-bold">AI Page Sozlamalari (Gemini)</span>
              </div>
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Dizayn va Rejim</p>
          <div className="glass-neon rounded-3xl overflow-hidden">
            <button onClick={() => onAction('edit-design')} className="w-full p-4 flex items-center justify-between border-b border-white/5 active:bg-white/5">
              <div className="flex items-center gap-4">
                <Palette className="text-pink-500" size={20} />
                <span className="text-sm font-bold">Neon Dizayn Sozlamalari</span>
              </div>
              <div className="bg-blue-500/20 px-2 py-1 rounded text-[10px] text-blue-400 font-bold">PRO</div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
