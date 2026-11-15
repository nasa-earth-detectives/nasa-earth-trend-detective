/**
 * useDetectiveWizard.ts
 *
 * Controls whether the welcome wizard should be displayed.
 * Only appears the first time (localStorage). The user can
 * dismiss it or reopen it from the UI.
 */

import { useState, useCallback } from 'react';
import type { ClimateVariable } from '../types/climate.types';

const STORAGE_KEY = 'nasa_detective_wizard_seen';

export interface WizardSelection {
  variable: ClimateVariable;
  lat: number;
  lng: number;
  startYear: number;
  endYear: number;
  regionId: string;
}

export function useDetectiveWizard() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const dismiss = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* optional storage */ }
  }, []);

  const reopen = useCallback(() => setOpen(true), []);

  return { open, dismiss, reopen };
}
