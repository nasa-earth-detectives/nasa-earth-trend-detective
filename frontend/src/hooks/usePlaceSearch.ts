import { useEffect, useState } from 'react';
import type { Locale } from '../i18n/types';
import { knownPlaces, searchPlaces, type Place } from '../services/placeSearch';

interface PlaceSearchState { key: string | null; places: Place[]; loading: boolean; failed: boolean }

/** Shorter than this, a name matches half the world. */
const MIN_CHARACTERS = 2;
/** One request per pause in the typing, not per key. */
const PAUSE_MS = 280;

/**
 * Places for what is being typed. The built-in ones are there at once; those of the search service
 * replace the list when it answers, and an answer to an older text is dropped.
 */
export function usePlaceSearch(query: string, locale: Locale) {
  const term = query.trim();
  const key = term.length >= MIN_CHARACTERS ? `${locale}:${term.toLowerCase()}` : null;
  const [state, setState] = useState<PlaceSearchState>({ key: null, places: [], loading: false, failed: false });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    setState({ key, places: knownPlaces(term), loading: true, failed: false });
    const timer = window.setTimeout(() => {
      searchPlaces(term, locale, controller.signal)
        .then(result => {
          if (!controller.signal.aborted) setState({ key, places: result.places, loading: false, failed: result.remoteFailed });
        })
        .catch(() => {
          if (!controller.signal.aborted) setState({ key, places: knownPlaces(term), loading: false, failed: true });
        });
    }, PAUSE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, term, locale]);

  const current = key !== null && state.key === key;
  return {
    /** Something long enough to search for has been typed. */
    ready: key !== null,
    places: current ? state.places : [],
    loading: key !== null && (!current || state.loading),
    failed: current && state.failed,
  };
}
