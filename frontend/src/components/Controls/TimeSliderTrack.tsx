import { useState } from 'react';
import { CLIMATE_MILESTONES, MILESTONE_YEARS } from '../../config/climateMilestones';
import { ClimateMilestoneTooltip } from './ClimateMilestoneTooltip';
import { useI18n } from '../../i18n';

interface TimeSliderTrackProps {
  startYear: number;
  endYear: number;
  currentYear: number;
  missionLabel: string;
  onSelectYear: (year: number) => void;
  onPausePlayback: () => void;
}

export function TimeSliderTrack({
  startYear,
  endYear,
  currentYear,
  missionLabel,
  onSelectYear,
  onPausePlayback,
}: TimeSliderTrackProps) {
  const { t } = useI18n();
  const [dismissedMilestoneYear, setDismissedMilestoneYear] = useState<number | null>(null);
  const span = Math.max(endYear - startYear, 0);
  const years = Array.from({ length: span + 1 }, (_, index) => startYear + index);
  const marks = years.filter(
    (year) => year === startYear || year === endYear || (year % 5 === 0 && year - startYear > 1 && endYear - year > 1)
  );

  const activeMilestone = dismissedMilestoneYear === currentYear ? undefined : CLIMATE_MILESTONES[currentYear];

  return (
    <div className="time-scale-wrapper">
      <div className="time-scale">
        <input
          type="range"
          min={startYear}
          max={endYear}
          step={1}
          value={currentYear}
          disabled={span === 0}
          onChange={(event) => onSelectYear(Number(event.target.value))}
          onPointerDown={onPausePlayback}
          aria-label={t.timeline.eyebrow}
          aria-valuetext={`${currentYear}, ${missionLabel}`}
          className="time-range"
        />

        <span className="time-axis" aria-hidden="true" />

        {/* Year tick marks */}
        <div className="time-ticks" aria-hidden="true">
          {years.map((year) => {
            const isMilestone = Boolean(CLIMATE_MILESTONES[year]);
            return (
              <span
                key={year}
                data-major={year % 5 === 0}
                data-milestone={isMilestone}
                data-past={year <= currentYear}
                className={isMilestone ? 'tick-milestone' : ''}
              />
            );
          })}
        </div>

        {/* Interactive historical milestone beacons */}
        <div className="time-milestone-beacons">
          {MILESTONE_YEARS.filter((yr) => yr >= startYear && yr <= endYear).map((year) => {
            const position = ((year - startYear) / (span || 1)) * 100;
            const isSelected = year === currentYear;
            const localizedTitle = t.milestones[year]?.title ?? CLIMATE_MILESTONES[year].title;

            return (
              <button
                key={year}
                type="button"
                className={`milestone-beacon ${isSelected ? 'selected' : ''}`}
                style={{ left: `${position}%` }}
                onClick={() => { setDismissedMilestoneYear(null); onSelectYear(year); }}
                aria-label={`${year} ${t.timeline.milestoneSuffix}: ${localizedTitle}`}
                title={`${year}: ${localizedTitle}`}
              >
                <span className="beacon-dot" />
              </button>
            );
          })}
        </div>

        <span className="time-progress" aria-hidden="true" />
        <span className="time-cursor" aria-hidden="true" />
      </div>

      {/* Year labels */}
      <div className="time-mark-labels" aria-hidden="true">
        {marks.map((year) => {
          const position = ((year - startYear) / (span || 1)) * 100;
          return (
            <span
              key={year}
              style={{ left: `${position}%`, transform: `translateX(-${position}%)` }}
            >
              {year}
            </span>
          );
        })}
      </div>

      {/* Selected milestone detail; does not shift controls on hover. */}
      {activeMilestone && (
        <div className="milestone-tooltip-container">
          <ClimateMilestoneTooltip
            milestone={activeMilestone}
            onClose={() => setDismissedMilestoneYear(activeMilestone.year)}
          />
        </div>
      )}
    </div>
  );
}
