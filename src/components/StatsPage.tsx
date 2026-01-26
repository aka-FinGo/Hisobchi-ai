import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StatsPage({ data }: { data: AppData }) {
  // Oylik daromad va xarajat diagrammasi uchun ma'lumot
  const monthlyData = [
    { name: 'Okt', inc: 4000000, exp: 3200000 },
    { name: 'Noy', inc: 3800000, exp: 3500000 },
    { name: 'Dek', inc: 5200000, exp: 4100000 },
  ];

  return (
    <div className="p-6 pb-32 space-y-8 overflow-y-auto h-full scrollbar-hide">
      <h2 className="text-2xl font-black neon-text-purple uppercase tracking-tighter mt-4">Analitika 2.0</h2>
      
      <div className="glass-neon p-6 rounded-[35px]">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Oylik solishtirish</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" stroke="#64748b" style={{fontSize: '10px'}} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px'}} />
              <Bar dataKey="inc" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exp" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
