import { useEffect, useId, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { CalendarRange } from 'lucide-react';
import { useTimelinePlayback } from '../../hooks/useTimelinePlayback';
import { TimelineTransportControls } from './TimelineTransportControls';
import { TimeSliderTrack } from './TimeSliderTrack';
import '../../styles/timeline.css';

interface TimeNavigatorProps {
  startYear: number;
  endYear: number;
  currentYear: number;
  missionLabel: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onPlaybackChange: (playing: boolean) => void;
  onChange: (year: number) => void;
}

/**
 * Navegador temporal espacial interactivo (Sprint 3 [S3-T5]).
 * Orquesta la barra de tiempo 2000-2026, control multivelocidad e hitos climáticos.
 */
export function TimeNavigator({
  startYear,
  endYear,
  currentYear,
  missionLabel,
  collapsed,
  onToggleCollapsed,
  onPlaybackChange,
  onChange,
}: TimeNavigatorProps) {
  const scaleId = useId();
  const exploreButton = useRef<HTMLButtonElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const observedField = useRef<HTMLDivElement>(null);
  const focusAfterOpen = useRef(false);

  const playback = useTimelinePlayback({
    startYear, endYear, currentYear, onChange, onPlaybackChange,
  });

  useEffect(() => {
    if (collapsed) playback.pausePlayback();
  }, [collapsed, playback.pausePlayback]);

  useLayoutEffect(() => {
    if (!collapsed && focusAfterOpen.current) {
      playButton.current?.focus({ preventScroll: true });
      focusAfterOpen.current = false;
    }
  }, [collapsed]);

  const openArchive = () => {
    focusAfterOpen.current = true;
    onToggleCollapsed();
  };

  const closeArchive = () => {
    onToggleCollapsed();
    window.requestAnimationFrame(() => exploreButton.current?.focus());
  };

  const selectYear = (year: number) => {
    playback.pausePlayback();
    onChange(Math.min(endYear, Math.max(startYear, year)));
  };

  const span = Math.max(endYear - startYear, 0);
  const progress = Math.min(100, Math.max(0, ((currentYear - startYear) / (span || 1)) * 100));

  return (
    <section
      id="mission-time-navigator"
      className="time-navigator"
      aria-label="Navegador temporal de la misión"
      data-playing={playback.isPlaying}
      data-collapsed={collapsed}
      data-ui-control
      style={{ '--timeline-progress': `${progress}%` } as CSSProperties}
    >
      {/* Campo de año observado siempre visible */}
      <div ref={observedField} className="time-observed">
        <span className="time-eyebrow">Año de consulta</span>
        <span className="time-year" aria-label={`Año seleccionado: ${currentYear}`}>
          <span key={currentYear}>{currentYear}</span>
        </span>
        {collapsed ? (
          <button
            ref={exploreButton}
            className="time-explore"
            type="button"
            onClick={openArchive}
            aria-expanded={false}
            aria-controls={scaleId}
          >
            <CalendarRange size={14} aria-hidden="true" /> Ajustar año
          </button>
        ) : (
          <span className="time-state">{playback.isPlaying ? `Recorrido (${playback.speed}x)` : 'Año seleccionado'}</span>
        )}
      </div>

      {/* Escala detallada flotante */}
      <div id={scaleId} className="time-detail" inert={collapsed} aria-hidden={collapsed}>
        <div className="time-detail-inner">
          <div className="time-heading">
            <div className="time-mission">
              <span className="time-source-label">Producto seleccionado</span>
              <span key={missionLabel} className="time-source">{missionLabel}</span>
            </div>

            <TimelineTransportControls
              playButtonRef={playButton}
              isPlaying={playback.isPlaying}
              speed={playback.speed}
              isLooping={playback.isLooping}
              currentYear={currentYear}
              startYear={startYear}
              endYear={endYear}
              scaleId={scaleId}
              onSelectYear={selectYear}
              onTogglePlayback={playback.togglePlayback}
              onResetPlayback={playback.resetPlayback}
              onCycleSpeed={playback.cycleSpeed}
              onToggleLoop={playback.toggleLoop}
              onCloseArchive={closeArchive}
            />
          </div>

          <TimeSliderTrack
            startYear={startYear}
            endYear={endYear}
            currentYear={currentYear}
            missionLabel={missionLabel}
            onSelectYear={selectYear}
            onPausePlayback={playback.pausePlayback}
          />

          <div className="time-range-context">
            <span>Rango de exploración <strong>{startYear}—{endYear}</strong></span>
            <span>Velocidad actual <strong>{playback.speed}x ({1200 / playback.speed}ms/año)</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
