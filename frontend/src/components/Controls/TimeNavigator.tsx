import { useEffect, useId, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { CalendarRange } from 'lucide-react';
import { useTimelinePlayback } from '../../hooks/useTimelinePlayback';
import { TimelineTransportControls } from './TimelineTransportControls';
import { TimeSliderTrack } from './TimeSliderTrack';
import { formatTemplate, useI18n } from '../../i18n';
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
 * Interactive spatial time navigator (Sprint 3 [S3-T5]).
 * Orchestrates the 2000-2026 time bar, multi-speed controls, and climate milestones.
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
  const { t } = useI18n();
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
      aria-label={t.timeline.navAria}
      data-playing={playback.isPlaying}
      data-collapsed={collapsed}
      data-ui-control
      style={{ '--timeline-progress': `${progress}%` } as CSSProperties}
    >
      {/* Always visible observed year field */}
      <div ref={observedField} className="time-observed">
        <span className="time-eyebrow">{t.timeline.eyebrow}</span>
        <span className="time-year" aria-label={formatTemplate(t.timeline.selectedYearAria, { year: currentYear })}>
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
            <CalendarRange size={14} aria-hidden="true" /> {t.timeline.adjustYear}
          </button>
        ) : (
          <span className="time-state">
            {playback.isPlaying ? formatTemplate(t.timeline.playingSpeed, { speed: playback.speed }) : t.timeline.selectedState}
          </span>
        )}
      </div>

      {/* Floating detailed scale */}
      <div id={scaleId} className="time-detail" inert={collapsed} aria-hidden={collapsed}>
        <div className="time-detail-inner">
          <div className="time-heading">
            <div className="time-mission">
              <span className="time-source-label">{t.timeline.selectedProduct}</span>
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
            <span>{t.timeline.explorationRange} <strong>{startYear}—{endYear}</strong></span>
            <span>{t.timeline.currentSpeed} <strong>{playback.speed}x ({1200 / playback.speed}{t.timeline.msPerYr})</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
