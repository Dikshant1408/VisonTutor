import React, { useEffect, useState } from 'react';
import { Stage, Layer, Text, Line, Rect, Group } from 'react-konva';
import { motion } from 'motion/react';
import { Sparkles, Eraser, Download } from 'lucide-react';

interface WhiteboardStep {
  id: string;
  content: string;
  type: 'text' | 'equation' | 'diagram';
  x: number;
  y: number;
}

interface AIWhiteboardProps {
  steps: WhiteboardStep[];
  onClear: () => void;
  className?: string;
}

export const AIWhiteboard: React.FC<AIWhiteboardProps> = ({ steps, onClear, className }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={onClear}
          className="p-2 rounded-xl bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-zinc-400 hover:text-rose-400 transition-colors"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {/* Grid Background */}
          <Group>
            {Array.from({ length: 20 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 40, 0, i * 40, dimensions.height]}
                stroke="#18181b"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 40, dimensions.width, i * 40]}
                stroke="#18181b"
                strokeWidth={1}
              />
            ))}
          </Group>

          {steps.map((step, index) => (
            <Group 
              key={step.id} 
              x={step.x} 
              y={step.y}
              opacity={1}
              listening={false}
            >
              <Rect
                width={300}
                height={60}
                fill="#18181b"
                cornerRadius={12}
                stroke="#27272a"
                strokeWidth={1}
                shadowBlur={10}
                shadowColor="rgba(0,0,0,0.5)"
              />
              <Text
                text={step.content}
                fontSize={18}
                fontFamily="JetBrains Mono"
                fill="#10b981"
                padding={20}
                width={300}
                align="center"
              />
              {index < steps.length - 1 && (
                <Line
                  points={[150, 60, 150, 100]}
                  stroke="#3f3f46"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              )}
            </Group>
          ))}
        </Layer>
      </Stage>

      {steps.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 pointer-events-none">
          <Sparkles className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium uppercase tracking-widest opacity-40">AI Whiteboard Ready</p>
        </div>
      )}
    </div>
  );
};
