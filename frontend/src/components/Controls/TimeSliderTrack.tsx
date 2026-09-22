import { useState } from 'react';
import { CLIMATE_MILESTONES, MILESTONE_YEARS } from '../../config/climateMilestones';
import { ClimateMilestoneTooltip } from './ClimateMilestoneTooltip';

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
  const [hoveredMilestoneYear, setHoveredMilestoneYear] = useState<number | null>(null);
  const span = Math.max(endYear - startYear, 0);
  const years = Array.from({ length: span + 1 }, (_, index) => startYear + index);
  const marks = years.filter(
    (year) => year === startYear || year === endYear || (year % 5 === 0 && year - startYear > 1 && endYear - year > 1)
  );

  const activeMilestone = hoveredMilestoneYear
    ? CLIMATE_MILESTONES[hoveredMilestoneYear]
    : CLIMATE_MILESTONES[currentYear];

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
          aria-label="Año de consulta"
          aria-valuetext={`${currentYear}, ${missionLabel}`}
          className="time-range"
        />

        <span className="time-axis" aria-hidden="true" />

        {/* Marcas de años (Ticks) */}
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

        {/* Balizas interactivas de hitos históricos */}
        <div className="time-milestone-beacons" aria-hidden="true">
          {MILESTONE_YEARS.filter((yr) => yr >= startYear && yr <= endYear).map((year) => {
            const position = ((year - startYear) / (span || 1)) * 100;
            const isSelected = year === currentYear;
            const milestone = CLIMATE_MILESTONES[year];

            return (
              <button
                key={year}
                type="button"
                className={`milestone-beacon ${isSelected ? 'selected' : ''}`}
                style={{ left: `${position}%` }}
                onClick={() => onSelectYear(year)}
                onMouseEnter={() => setHoveredMilestoneYear(year)}
                onMouseLeave={() => setHoveredMilestoneYear(null)}
                aria-label={`Hito de ${year}: ${milestone.title}`}
                title={`${year}: ${milestone.title}`}
              >
                <span className="beacon-ping" />
                <span className="beacon-dot" />
              </button>
            );
          })}
        </div>

        <span className="time-progress" aria-hidden="true" />
        <span className="time-cursor" aria-hidden="true" />
      </div>

      {/* Etiquetas anuales */}
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

      {/* Tooltip contextual si hay un hito activo o hovered */}
      {activeMilestone && (
        <div className="milestone-tooltip-container">
          <ClimateMilestoneTooltip
            milestone={activeMilestone}
            onClose={() => setHoveredMilestoneYear(null)}
          />
        </div>
      )}
    </div>
  );
}
