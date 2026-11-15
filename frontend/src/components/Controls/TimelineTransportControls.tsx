import type { RefObject } from 'react';
import { Play, Pause, RotateCcw, ChevronUp, Repeat, Zap } from 'lucide-react';
import type { PlaybackSpeed } from '../../hooks/useTimelinePlayback';
import { formatTemplate, useI18n } from '../../i18n';

interface TimelineTransportControlsProps {
  playButtonRef: RefObject<HTMLButtonElement | null>;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  isLooping: boolean;
  currentYear: number;
  startYear: number;
  endYear: number;
  scaleId: string;
  onSelectYear: (year: number) => void;
  onTogglePlayback: () => void;
  onResetPlayback: () => void;
  onCycleSpeed: () => void;
  onToggleLoop: () => void;
  onCloseArchive: () => void;
}

export function TimelineTransportControls({
  playButtonRef,
  isPlaying,
  speed,
  isLooping,
  currentYear,
  startYear,
  endYear,
  scaleId,
  onSelectYear,
  onTogglePlayback,
  onResetPlayback,
  onCycleSpeed,
  onToggleLoop,
  onCloseArchive,
}: TimelineTransportControlsProps) {
  const { t } = useI18n();
  const span = Math.max(endYear - startYear, 0);

  return (
    <div className="time-transport" role="group" aria-label={t.timeline.transportAria}>
      <button
        className="time-control time-step"
        type="button"
        onClick={() => onSelectYear(currentYear - 1)}
        disabled={currentYear <= startYear}
        aria-label={t.timeline.prevYearAria}
        title={t.timeline.prevYearTitle}
      >
        −1
      </button>

      <button
        ref={playButtonRef}
        className="time-control time-play"
        type="button"
        onClick={onTogglePlayback}
        disabled={span === 0}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? t.timeline.pauseAria : t.timeline.playAria}
        title={isPlaying ? t.timeline.pauseTitle : t.timeline.playTitle}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        <span className="time-play-label">{isPlaying ? t.timeline.pause : t.timeline.play}</span>
      </button>

      <button
        className="time-control time-step"
        type="button"
        onClick={() => onSelectYear(currentYear + 1)}
        disabled={currentYear >= endYear}
        aria-label={t.timeline.nextYearAria}
        title={t.timeline.nextYearTitle}
      >
        +1
      </button>

      <button
        className={`time-control time-speed ${speed > 1 ? 'active-speed' : ''}`}
        type="button"
        onClick={onCycleSpeed}
        aria-label={formatTemplate(t.timeline.speedAria, { speed })}
        title={t.timeline.speedTitle}
      >
        <Zap size={13} aria-hidden="true" />
        <span>{speed}x</span>
      </button>

      <button
        className={`time-control time-loop ${isLooping ? 'active-loop' : ''}`}
        type="button"
        onClick={onToggleLoop}
        aria-pressed={isLooping}
        aria-label={isLooping ? t.timeline.loopOnAria : t.timeline.loopOffAria}
        title={isLooping ? t.timeline.loopOnTitle : t.timeline.loopOffTitle}
      >
        <Repeat size={14} aria-hidden="true" />
      </button>

      <button
        className="time-control time-reset"
        type="button"
        onClick={onResetPlayback}
        disabled={!isPlaying && currentYear === startYear}
        aria-label={formatTemplate(t.timeline.resetTo, { year: startYear })}
        title={formatTemplate(t.timeline.resetTo, { year: startYear })}
      >
        <RotateCcw size={14} aria-hidden="true" />
      </button>

      <button
        className="time-control time-collapse"
        type="button"
        onClick={onCloseArchive}
        aria-label={t.timeline.closeArchiveAria}
        aria-expanded={true}
        aria-controls={scaleId}
        title={t.timeline.closeArchiveTitle}
      >
        <ChevronUp size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
