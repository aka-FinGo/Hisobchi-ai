import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
// ... (boshqa importlar o'zgarishsiz)

// ...

// CustomTooltip (o'zgarishsiz, faqat css klassi muhim)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="hud-tooltip animate-slideUp">
         {/* ... (mazmuni o'zgarishsiz) */}
         <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{data.name}</p>
         <h4 className="text-lg font-bold text-white">{data.value.toLocaleString()} {data.currency}</h4>
         <div className="text-[#00d4ff] text-xs font-bold mt-1">{data.percent}%</div>
      </div>
    );
  }
  return null;
};

export default function HomePage({ data, onNavigate, onTransactionClick, onContextMenu, onAddWallet }: HomePageProps) {
  // ... (Logika o'zgarishsiz)

  return (
    <div className="h-full flex flex-col overflow-y-auto pt-safe px-4 pb-48" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
       {/* ... Header va View Indicator ... */}

       <div className={`flex-1 ${animClass}`}>
          {viewMode === 'chart' && (
            <div className="flex justify-center mb-8 relative">
               <div className="w-[300px] h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {/* ... Pie Chartlar ... */}
                      <Pie data={chartData} innerRadius={90} outerRadius={115} paddingAngle={6} cornerRadius={6} dataKey="value" stroke="none" onClick={(e) => {/*...*/}}>
                        {chartData.map((e, i) => <Cell key={i} fill={e.fill} className="chart-3d-filter cursor-pointer hover:opacity-80"/>)}
                      </Pie>
                      <Pie data={chartData} innerRadius={82} outerRadius={84} dataKey="value" stroke="none" isAnimationActive={false}>
                        {chartData.map((e, i) => <Cell key={i} fill={e.fill} className="chart-neon-glow"/>)}
                      </Pie>

                      {/* TOOLTIP FIX */}
                      <Tooltip 
                        content={<CustomTooltip />} 
                        wrapperStyle={{ zIndex: 1000 }} // MUHIM: Recharts wrapperiga z-index berish
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Statistika Tugmasi z-index: 10 (Tooltipdan pastda) */}
                  <button onClick={() => onNavigate('stats')} className="absolute inset-0 m-auto w-32 h-32 rounded-full hud-pressed flex flex-col items-center justify-center active:scale-95 z-10 border border-[#00d4ff]/20">
                    <Layers size={28} className="text-[#00d4ff] mb-2 drop-shadow-[0_0_5px_#00d4ff]"/>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Statistika</p>
                  </button>
               </div>
            </div>
          )}
          
          {/* ... Kartalar va Tranzaksiyalar ... */}
       </div>
    </div>
  );
}
