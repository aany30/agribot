import React, { useContext } from 'react';
import { AgriContext } from '../context/AgriContext';
import { Cloud, Sun, CloudRain } from 'lucide-react';

export default function WeatherWidget() {
  const { weatherData } = useContext(AgriContext);

  if (!weatherData) return null;

  const getWeatherIcon = (condition) => {
    const c = condition?.toLowerCase() || '';
    if (c.includes('rain') || c.includes('storm')) return <CloudRain className="text-blue-500" size={24} />;
    if (c.includes('cloud')) return <Cloud className="text-gray-400" size={24} />;
    return <Sun className="text-gold" size={24} />;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-green-mid/20 relative z-10">
      <h3 className="font-heading text-lg font-semibold text-green-deep mb-4">5-Day Forecast</h3>
      
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {weatherData.forecast.map((day, i) => (
          <div key={i} className="flex-shrink-0 w-[4.5rem] flex flex-col items-center bg-cream rounded-xl p-3 border border-green-mid/10 hover:border-gold/50 transition">
            <div className="text-xs font-bold text-text-muted mb-2">{day.day || `Day ${i+1}`}</div>
            {getWeatherIcon(day.condition || day.weather)}
            <div className="text-base font-bold text-green-deep mt-2">{Math.round(day.temp)}°</div>
            
            <div className="w-full h-1.5 bg-green-mid/10 rounded-full mt-3 overflow-hidden relative">
              <div 
                className="absolute left-0 top-0 h-full bg-blue-400 rounded-full" 
                style={{ width: `${day.rain_prob}%` }}
              />
            </div>
            <div className="text-[9px] font-bold text-blue-500 mt-1">{day.rain_prob}%</div>
          </div>
        ))}
      </div>

      {weatherData.advisory && (
        <div className="mt-4 italic text-sm text-green-deep bg-green-deep/5 p-4 rounded-xl border border-green-deep/10 font-medium leading-relaxed">
          "{weatherData.advisory}"
        </div>
      )}
    </div>
  );
}
