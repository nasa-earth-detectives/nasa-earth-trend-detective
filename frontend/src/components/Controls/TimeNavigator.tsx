import { useEffect, useId, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { CalendarRange, ChevronUp, RotateCcw } from 'lucide-react';
import { useTimelinePlayback } from '../../hooks/useTimelinePlayback';
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
/** El año observado permanece visible; la escala se abre como un modo de trabajo. */
export function TimeNavigator({
  startYear, endYear, currentYear, missionLabel, collapsed,
  onToggleCollapsed, onPlaybackChange, onChange,
}: TimeNavigatorProps) {
  const scaleId = useId();
  const exploreButton = useRef<HTMLButtonElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const observedField = useRef<HTMLDivElement>(null);
  const observedRect = useRef<DOMRect | null>(null);
  const fieldAnimation = useRef<Animation | null>(null);
  const focusAfterOpen = useRef(false);
  const { isPlaying, togglePlayback, pausePlayback, resetPlayback } = useTimelinePlayback({
    startYear, endYear, currentYear, onChange, onPlaybackChange,
  });
  useEffect(() => { if (collapsed) pausePlayback(); }, [collapsed, pausePlayback]);
  useLayoutEffect(() => {
    const field = observedField.current;
    if (!field) return;
    const previous = observedRect.current;
    const style = window.getComputedStyle(field);
    const transform = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    // Conserva el punto visible de una transición interrumpida antes de cancelarla.
    fieldAnimation.current?.cancel();
    const next = field.getBoundingClientRect();
    observedRect.current = next;
    if (previous && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const dx = previous.left + transform.m41 - next.left;
      const dy = previous.top + transform.m42 - next.top;
      const token = style.getPropertyValue('--motion-panel').trim();
      const duration = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000) || 420;
      if (Math.abs(dx) + Math.abs(dy) > 1) {
        fieldAnimation.current = field.animate([
          { transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' },
        ], { duration, easing: style.getPropertyValue('--ease-instrument').trim() || 'ease-out' });
      }
    }
    if (!collapsed && focusAfterOpen.current) {
      playButton.current?.focus({ preventScroll: true });
      focusAfterOpen.current = false;
    }
  }, [collapsed]);
  useLayoutEffect(() => {
    const refreshPosition = () => {
      fieldAnimation.current?.cancel();
      observedRect.current = observedField.current?.getBoundingClientRect() ?? null;
    };
    window.addEventListener('resize', refreshPosition);
    return () => {
      fieldAnimation.current?.cancel();
      window.removeEventListener('resize', refreshPosition);
    };
  }, []);
  const openArchive = () => {
    focusAfterOpen.current = true;
    onToggleCollapsed();
  };
  const closeArchive = () => {
    onToggleCollapsed();
    window.requestAnimationFrame(() => exploreButton.current?.focus());
  };
  const selectYear = (year: number) => {
    pausePlayback();
    onChange(Math.min(endYear, Math.max(startYear, year)));
  };
  const span = Math.max(endYear - startYear, 0);
  const progress = Math.min(100, Math.max(0, ((currentYear - startYear) / (span || 1)) * 100));
  const years = Array.from({ length: span + 1 }, (_, index) => startYear + index);
  const marks = years.filter((year) => year === startYear || year === endYear
    || (year % 5 === 0 && year - startYear > 2 && endYear - year > 2));

  return (
    <section
      id="mission-time-navigator"
      className="time-navigator"
      aria-label="Navegador temporal"
      data-playing={isPlaying}
      data-collapsed={collapsed}
      data-ui-control
      style={{ '--timeline-progress': `${progress}%` } as CSSProperties}
    >
      <div ref={observedField} className="time-observed">
        <span className="time-eyebrow">Año de consulta</span>
        <span className="time-year" aria-label={`Año seleccionado: ${currentYear}`}>
          <span key={currentYear}>{currentYear}</span>
        </span>
        {collapsed ? (
          <button ref={exploreButton} className="time-explore" type="button" onClick={openArchive}
            aria-expanded={false} aria-controls={scaleId}>
            <CalendarRange size={14} aria-hidden="true" /> Ajustar año
          </button>
        ) : <span className="time-state">{isPlaying ? 'Recorrido anual' : 'Año seleccionado'}</span>}
      </div>

      <div id={scaleId} className="time-detail" inert={collapsed} aria-hidden={collapsed}>
        <div className="time-detail-inner">
          <div className="time-heading">
            <div className="time-mission">
              <span className="time-source-label">Producto seleccionado</span>
              <span key={missionLabel} className="time-source">{missionLabel}</span>
            </div>
            <div className="time-transport" role="group" aria-label="Controles temporales">
              <button className="time-control time-step" type="button" onClick={() => selectYear(currentYear - 1)}
                disabled={currentYear <= startYear} aria-label="Seleccionar año anterior" title="Año anterior">−1</button>
              <button ref={playButton} className="time-control time-play" type="button" onClick={togglePlayback}
                disabled={span === 0} aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pausar recorrido temporal' : 'Reproducir recorrido temporal'}
                title={isPlaying ? 'Pausar' : 'Reproducir'}>
                <span className="time-play-symbol" aria-hidden="true"><i /><i /></span>
                <span className="time-play-label">{isPlaying ? 'Pausar' : 'Recorrer'}</span>
              </button>
              <button className="time-control time-step" type="button" onClick={() => selectYear(currentYear + 1)}
                disabled={currentYear >= endYear} aria-label="Seleccionar año siguiente" title="Año siguiente">+1</button>
              <button className="time-control time-reset" type="button" onClick={resetPlayback}
                disabled={!isPlaying && currentYear === startYear}
                aria-label={`Reiniciar en ${startYear}`} title={`Reiniciar en ${startYear}`}>
                <RotateCcw size={15} aria-hidden="true" />
              </button>
              <button className="time-control time-collapse" type="button" onClick={closeArchive}
                aria-label="Cerrar archivo temporal" aria-expanded={true} aria-controls={scaleId}
                title="Cerrar archivo temporal">
                <ChevronUp size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="time-scale">
            <input type="range" min={startYear} max={endYear} step={1} value={currentYear}
              disabled={span === 0} onChange={(event) => selectYear(Number(event.target.value))}
              onPointerDown={pausePlayback} aria-label="Año de consulta" aria-valuetext={`${currentYear}, ${missionLabel}`}
              className="time-range" />
            <span className="time-axis" aria-hidden="true" />
            <div className="time-ticks" aria-hidden="true">
              {years.map((year) => <span key={year} data-major={year % 5 === 0}
                data-past={year <= currentYear} />)}
            </div>
            <span className="time-progress" aria-hidden="true" />
            <span className="time-cursor" aria-hidden="true" />
          </div>
          <div className="time-mark-labels" aria-hidden="true">
            {marks.map((year) => {
              const position = ((year - startYear) / (span || 1)) * 100;
              return <span key={year} style={{ left: `${position}%`,
                transform: `translateX(-${position}%)` }}>{year}</span>;
            })}
          </div>
          <div className="time-range-context">
            <span>Rango de exploración <strong>{startYear}—{endYear}</strong></span>
            <span>Paso <strong>1 año</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
