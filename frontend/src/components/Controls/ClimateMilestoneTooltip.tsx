import { Sparkles, X } from 'lucide-react';
import type { ClimateMilestone } from '../../config/climateMilestones';
import { useI18n } from '../../i18n';

interface ClimateMilestoneTooltipProps {
  milestone: ClimateMilestone;
  onClose?: () => void;
}

export function ClimateMilestoneTooltip({ milestone, onClose }: ClimateMilestoneTooltipProps) {
  const { t } = useI18n();
  const copy = t.milestones[milestone.year] ?? milestone;
  return (
    <div
      className="climate-milestone-tooltip"
      role="region"
      aria-label={`${milestone.year} ${t.timeline.milestoneSuffix}`}
      aria-live="polite"
    >
      <div className="milestone-tooltip-header">
        <div className="milestone-tooltip-badge">
          <Sparkles size={13} aria-hidden="true" />
          <span>{copy.categoryLabel} · {milestone.year}</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="milestone-tooltip-close"
            onClick={onClose}
            aria-label={t.timeline.closeMilestoneAria}
          >
            <X size={12} />
          </button>
        )}
      </div>
      <h4 className="milestone-tooltip-title">{copy.title}</h4>
      <p className="milestone-tooltip-summary">{copy.summary}</p>
      <div className="milestone-tooltip-impact">
        <span className="impact-label">{t.timeline.satelliteImpact}</span>
        <span className="impact-text">{copy.scientificImpact}</span>
      </div>
    </div>
  );
}
