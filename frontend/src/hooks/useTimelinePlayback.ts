import { useEffect, useState, useCallback, useRef } from 'react';

const PLAYBACK_INTERVAL_MS = 1200;

interface TimelinePlaybackParams {
  startYear: number;
  endYear: number;
  currentYear: number;
  onChange: (year: number) => void;
  onPlaybackChange: (playing: boolean) => void;
}
/** Un avance por año. Los cambios de interfaz no reinician el reloj. */
export function useTimelinePlayback({
  startYear, endYear, currentYear, onChange, onPlaybackChange,
}: TimelinePlaybackParams) {
  const [isPlaying, setIsPlaying] = useState(false);
  const latest = useRef({ startYear, endYear, currentYear, onChange });

  useEffect(() => {
    latest.current = { startYear, endYear, currentYear, onChange };
  }, [startYear, endYear, currentYear, onChange]);

  useEffect(() => {
    onPlaybackChange(isPlaying);
  }, [isPlaying, onPlaybackChange]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      const state = latest.current;
      state.onChange(state.currentYear >= state.endYear ? state.startYear : state.currentYear + 1);
    }, PLAYBACK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const togglePlayback = useCallback(() => setIsPlaying((value) => !value), []);
  const pausePlayback = useCallback(() => setIsPlaying(false), []);
  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    onChange(startYear);
  }, [onChange, startYear]);

  return { isPlaying, togglePlayback, pausePlayback, resetPlayback };
}
