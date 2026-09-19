import { Play, Pause, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TimeSliderProps {
  startYear: number;
  endYear: number;
  currentYear: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ startYear, endYear, currentYear, onChange }: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onChange(currentYear >= endYear ? startYear : currentYear + 1);
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentYear, startYear, endYear, onChange]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Línea Temporal Satelital</span>
        <span className="font-bold text-cyan-400 text-sm">{currentYear}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChange(startYear);
          }}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Reiniciar"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <input
          type="range"
          min={startYear}
          max={endYear}
          value={currentYear}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        <span className="text-xs text-slate-500 font-mono">{endYear}</span>
      </div>
    </div>
  );
}
