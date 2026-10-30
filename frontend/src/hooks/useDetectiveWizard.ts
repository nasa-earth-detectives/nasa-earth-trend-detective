/**
 * useDetectiveWizard.ts
 *
 * Controla si el wizard de bienvenida debe mostrarse.
 * Solo aparece la primera vez (localStorage). El usuario puede
 * saltarlo o volver a abrirlo desde la UI.
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
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* storage opcional */ }
  }, []);

  const reopen = useCallback(() => setOpen(true), []);

  return { open, dismiss, reopen };
}
