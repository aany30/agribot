import React, { useContext } from 'react';
import { AgriContext } from '../context/AgriContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const AGENTS = [
  "CropAgent", "WeatherAgent", "MandiAgent", "PestAgent", 
  "SoilAgent", "FinanceAgent", "StorageAgent", "YieldAgent"
];

export default function AgentGraph() {
  const { agentStatus } = useContext(AgriContext);

  const getStatusColor = (agent) => {
    const status = agentStatus[agent]?.status;
    if (status === 'active') return 'border-gold text-gold agent-active';
    if (status === 'done') return 'border-success text-success bg-green-50';
    if (status === 'failed') return 'border-red-500 text-red-500 bg-red-50';
    return 'border-green-mid text-text-muted opacity-50'; // idle
  };

  const getStatusIcon = (status) => {
    if (status === 'active') return <Loader2 size={16} className="animate-spin" />;
    if (status === 'done') return <CheckCircle2 size={16} />;
    if (status === 'failed') return <XCircle size={16} />;
    return null;
  };

  return (
    <div className="bg-cream-dark rounded-2xl p-6 shadow-md border border-green-mid/20 relative">
      <h3 className="font-heading text-lg font-semibold text-green-deep mb-4 text-center">Neural Hive Activity</h3>
      
      <div className="relative w-full h-64 flex items-center justify-center">
        {/* Central Node */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-green-deep rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-gold">
          <div className="text-gold font-bold text-xs text-center leading-tight">Agri<br/>Core</div>
        </div>

        {/* Orbiting Nodes */}
        {AGENTS.map((agent, i) => {
          const angle = (i * 360) / AGENTS.length - 90; // Start from top
          const radius = 95; // px
          const x = Math.cos(angle * (Math.PI / 180)) * radius;
          const y = Math.sin(angle * (Math.PI / 180)) * radius;
          const status = agentStatus[agent]?.status || 'idle';

          return (
            <div 
              key={agent}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-500"
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            >
              <div className={`w-10 h-10 rounded-full border-2 bg-cream flex items-center justify-center shadow-sm transition-all duration-300 ${getStatusColor(agent)}`}>
                {getStatusIcon(status)}
              </div>
              <div className="text-[10px] font-mono mt-1 text-green-deep font-semibold tracking-tighter bg-cream/80 px-1 rounded backdrop-blur-sm">
                {agent.replace('Agent', '')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
