import { Sparkles, X } from 'lucide-react';
import type { ClimateMilestone } from '../../config/climateMilestones';

interface ClimateMilestoneTooltipProps {
  milestone: ClimateMilestone;
  onClose?: () => void;
}

export function ClimateMilestoneTooltip({ milestone, onClose }: ClimateMilestoneTooltipProps) {
  return (
    <div
      className="climate-milestone-tooltip"
      role="region"
      aria-label={`Hito de ${milestone.year}`}
      aria-live="polite"
    >
      <div className="milestone-tooltip-header">
        <div className="milestone-tooltip-badge">
          <Sparkles size={13} aria-hidden="true" />
          <span>{milestone.categoryLabel} · {milestone.year}</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="milestone-tooltip-close"
            onClick={onClose}
            aria-label="Cerrar detalle del hito"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <h4 className="milestone-tooltip-title">{milestone.title}</h4>
      <p className="milestone-tooltip-summary">{milestone.summary}</p>
      <div className="milestone-tooltip-impact">
        <span className="impact-label">Impacto Satelital:</span>
        <span className="impact-text">{milestone.scientificImpact}</span>
      </div>
    </div>
  );
}
