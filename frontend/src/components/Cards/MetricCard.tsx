import { ClimateVariable, VariableMetadata } from '../../types/climate.types';
import { getVariableAccent } from '../../utils/colorScales';

interface MetricCardProps {
  metadata: VariableMetadata;
  selected: boolean;
  onSelect: (variable: ClimateVariable) => void;
}

export function MetricCard({ metadata, selected, onSelect }: MetricCardProps) {
  const accent = getVariableAccent(metadata.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(metadata.id)}
      style={{
        borderColor: selected ? accent.primary : undefined,
        boxShadow: selected ? `0 0 15px ${accent.glow}` : undefined,
      }}
      className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        selected
          ? 'bg-slate-800/80 border-cyan-400'
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          {metadata.satelliteMission}
        </span>
        <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800">
          {metadata.unit}
        </span>
      </div>
      <h3 className="font-semibold text-slate-100 text-sm mb-1">{metadata.name}</h3>
      <p className="text-xs text-slate-400 line-clamp-2">{metadata.description}</p>
    </button>
  );
}
