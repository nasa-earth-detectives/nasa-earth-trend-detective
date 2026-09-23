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
    <div className="time-transport" role="group" aria-label="Controles temporales y de reproducción">
      <button
        className="time-control time-step"
        type="button"
        onClick={() => onSelectYear(currentYear - 1)}
        disabled={currentYear <= startYear}
        aria-label="Seleccionar año anterior"
        title="Año anterior (-1)"
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
        aria-label={isPlaying ? 'Pausar recorrido temporal' : 'Reproducir recorrido temporal'}
        title={isPlaying ? 'Pausar recorrido' : 'Iniciar recorrido'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        <span className="time-play-label">{isPlaying ? 'Pausar' : 'Recorrer'}</span>
      </button>

      <button
        className="time-control time-step"
        type="button"
        onClick={() => onSelectYear(currentYear + 1)}
        disabled={currentYear >= endYear}
        aria-label="Seleccionar año siguiente"
        title="Año siguiente (+1)"
      >
        +1
      </button>

      <button
        className={`time-control time-speed ${speed > 1 ? 'active-speed' : ''}`}
        type="button"
        onClick={onCycleSpeed}
        aria-label={`Velocidad de reproducción: ${speed}x. Clic para cambiar.`}
        title="Cambiar velocidad (1x, 2x, 5x)"
      >
        <Zap size={13} aria-hidden="true" />
        <span>{speed}x</span>
      </button>

      <button
        className={`time-control time-loop ${isLooping ? 'active-loop' : ''}`}
        type="button"
        onClick={onToggleLoop}
        aria-pressed={isLooping}
        aria-label={isLooping ? 'Bucle temporal activado' : 'Bucle desactivado'}
        title={isLooping ? 'Bucle activado (repite al finalizar)' : 'Bucle desactivado'}
      >
        <Repeat size={14} aria-hidden="true" />
      </button>

      <button
        className="time-control time-reset"
        type="button"
        onClick={onResetPlayback}
        disabled={!isPlaying && currentYear === startYear}
        aria-label={`Reiniciar en ${startYear}`}
        title={`Reiniciar en ${startYear}`}
      >
        <RotateCcw size={14} aria-hidden="true" />
      </button>

      <button
        className="time-control time-collapse"
        type="button"
        onClick={onCloseArchive}
        aria-label="Cerrar archivo temporal"
        aria-expanded={true}
        aria-controls={scaleId}
        title="Cerrar panel temporal"
      >
        <ChevronUp size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
