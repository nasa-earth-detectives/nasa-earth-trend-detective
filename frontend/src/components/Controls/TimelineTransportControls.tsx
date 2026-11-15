import type { RefObject } from 'react';
import { Play, Pause, RotateCcw, ChevronUp, Repeat, Zap } from 'lucide-react';
import type { PlaybackSpeed } from '../../hooks/useTimelinePlayback';

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
  const span = Math.max(endYear - startYear, 0);

  return (
    <div className="time-transport" role="group" aria-label="Time and playback controls">
      <button
        className="time-control time-step"
        type="button"
        onClick={() => onSelectYear(currentYear - 1)}
        disabled={currentYear <= startYear}
        aria-label="Select previous year"
        title="Previous year (-1)"
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
        aria-label={isPlaying ? 'Pause time playback' : 'Play time playback'}
        title={isPlaying ? 'Pause playback' : 'Start playback'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        <span className="time-play-label">{isPlaying ? 'Pause' : 'Play'}</span>
      </button>

      <button
        className="time-control time-step"
        type="button"
        onClick={() => onSelectYear(currentYear + 1)}
        disabled={currentYear >= endYear}
        aria-label="Select next year"
        title="Next year (+1)"
      >
        +1
      </button>

      <button
        className={`time-control time-speed ${speed > 1 ? 'active-speed' : ''}`}
        type="button"
        onClick={onCycleSpeed}
        aria-label={`Playback speed: ${speed}x. Click to change.`}
        title="Change speed (1x, 2x, 5x)"
      >
        <Zap size={13} aria-hidden="true" />
        <span>{speed}x</span>
      </button>

      <button
        className={`time-control time-loop ${isLooping ? 'active-loop' : ''}`}
        type="button"
        onClick={onToggleLoop}
        aria-pressed={isLooping}
        aria-label={isLooping ? 'Time loop enabled' : 'Loop disabled'}
        title={isLooping ? 'Loop enabled (repeats at end)' : 'Loop disabled'}
      >
        <Repeat size={14} aria-hidden="true" />
      </button>

      <button
        className="time-control time-reset"
        type="button"
        onClick={onResetPlayback}
        disabled={!isPlaying && currentYear === startYear}
        aria-label={`Reset to ${startYear}`}
        title={`Reset to ${startYear}`}
      >
        <RotateCcw size={14} aria-hidden="true" />
      </button>

      <button
        className="time-control time-collapse"
        type="button"
        onClick={onCloseArchive}
        aria-label="Close time archive"
        aria-expanded={true}
        aria-controls={scaleId}
        title="Close time panel"
      >
        <ChevronUp size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
