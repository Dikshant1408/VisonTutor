import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

interface GraphViewProps {
  type: string;
  equation: string;
  data?: { x: number, y: number }[];
  onClose: () => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ type, equation, data, onClose }) => {
  // Generate data if not provided
  const plotData = data || Array.from({ length: 21 }, (_, i) => {
    const x = i - 10;
    // Simple linear parser for demo: y = mx + b
    const match = equation.match(/y\s*=\s*(-?\d*\.?\d*)x\s*([+-]\s*\d*\.?\d*)?/);
    let y = 0;
    if (match) {
      const m = parseFloat(match[1]) || (match[1] === '-' ? -1 : 1);
      const b = parseFloat(match[2]?.replace(/\s+/g, '')) || 0;
      y = m * x + b;
    }
    return { x, y };
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl h-[400px] p-8 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <h3 className="text-lg font-black tracking-tight text-white uppercase">Graph: {equation}</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Visualizing Function</p>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="x" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Line type="monotone" dataKey="y" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
