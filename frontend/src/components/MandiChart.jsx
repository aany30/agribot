import React, { useContext } from 'react';
import { AgriContext } from '../context/AgriContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MandiChart() {
  const { mandiData } = useContext(AgriContext);

  if (!mandiData) return null;

  const historicalData = Array.from({length: 7}).map((_, i) => {
    return {
      day: `D-${6-i}`,
      Indore: mandiData.prices[0]?.price - (6-i)*10 + Math.random()*20,
      Bhopal: mandiData.prices[1]?.price - (6-i)*5 + Math.random()*10,
      Ujjain: mandiData.prices[2]?.price - (6-i)*15 + Math.random()*30
    };
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-green-mid/20 mb-6 relative z-10">
      <h3 className="font-heading text-lg font-semibold text-green-deep mb-4">Mandi Price Trends</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalData}>
            <XAxis dataKey="day" stroke="#6b6b5a" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="#6b6b5a" fontSize={10} tickLine={false} axisLine={false} width={40} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(45, 90, 61, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Line type="monotone" dataKey="Indore" stroke="#1a3d2b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Bhopal" stroke="#c9a84c" strokeWidth={3} dot={{r: 4, fill: '#c9a84c'}} />
            <Line type="monotone" dataKey="Ujjain" stroke="#2d5a3d" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 bg-cream p-3 rounded-xl border border-gold/30">
        <div className="text-sm font-semibold text-green-deep mb-1 flex items-center">
          Best Mandi: <span className="text-gold ml-1 text-base">{mandiData.best_mandi}</span> <span className="ml-2 font-mono text-xs">@ ₹{mandiData.prices.find(p=>p.mandi===mandiData.best_mandi)?.price}/q</span>
        </div>
        <div className="text-xs text-text-muted font-medium">
          Arbitrage: {mandiData.arbitrage_opportunity}
        </div>
      </div>
    </div>
  );
}
