import { useEffect, useState, useCallback, useRef } from 'react';

export type PlaybackSpeed = 1 | 2 | 5;

const BASE_INTERVAL_MS = 1200;

const SPEED_INTERVALS: Record<PlaybackSpeed, number> = {
  1: BASE_INTERVAL_MS,
  2: BASE_INTERVAL_MS / 2, // 600ms
  5: BASE_INTERVAL_MS / 5, // 240ms
};

interface TimelinePlaybackParams {
  startYear: number;
  endYear: number;
  currentYear: number;
  onChange: (year: number) => void;
  onPlaybackChange: (playing: boolean) => void;
}

/**
 * Hook para control de reproducción temporal con velocidad regulable (1x, 2x, 5x)
 * y modo bucle (loop) para simulación histórica continua.
 */
export function useTimelinePlayback({
  startYear, endYear, currentYear, onChange, onPlaybackChange,
}: TimelinePlaybackParams) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isLooping, setIsLooping] = useState(true);
  const latest = useRef({ startYear, endYear, currentYear, onChange, isLooping });

  useEffect(() => {
    latest.current = { startYear, endYear, currentYear, onChange, isLooping };
  }, [startYear, endYear, currentYear, onChange, isLooping]);

  useEffect(() => {
    onPlaybackChange(isPlaying);
  }, [isPlaying, onPlaybackChange]);

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = SPEED_INTERVALS[speed];
    const interval = window.setInterval(() => {
      const state = latest.current;
      if (state.currentYear >= state.endYear) {
        if (state.isLooping) {
          state.onChange(state.startYear);
        } else {
          setIsPlaying(false);
        }
      } else {
        state.onChange(state.currentYear + 1);
      }
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [isPlaying, speed]);

  const togglePlayback = useCallback(() => setIsPlaying((value) => !value), []);
  const pausePlayback = useCallback(() => setIsPlaying(false), []);
  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    onChange(startYear);
  }, [onChange, startYear]);

  const cycleSpeed = useCallback(() => {
    setSpeed((current) => (current === 1 ? 2 : current === 2 ? 5 : 1));
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  return {
    isPlaying,
    speed,
    isLooping,
    togglePlayback,
    pausePlayback,
    resetPlayback,
    setSpeed,
    cycleSpeed,
    toggleLoop,
  };
}
