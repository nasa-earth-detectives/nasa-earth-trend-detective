import { driver, type DriveStep } from 'driver.js';
import { SATELLITE_TIMELINE } from '../config/climateLayers';
import { waitForTourTarget } from './tourTarget';
import 'driver.js/dist/driver.css';

export interface TourCallbacks {
  onResetView?: () => void;
  onOpenTime?: () => void;
  onOpenInspector?: () => void;
  onRunningChange?: (running: boolean) => void;
}

interface ObservationStep extends DriveStep {
  element: string;
  prepare?: () => void;
}

const getMissionSteps = (callbacks: TourCallbacks): ObservationStep[] => [
  {
    element: '#tour-launch-button', prepare: callbacks.onResetView,
    popover: {
      title: 'Guía de observación', side: 'bottom', align: 'start',
      description: '<p>Este botón abre la guía de los instrumentos de Trend Detective.</p><p class="tour-hint">Avanza con Siguiente o las flechas del teclado. Esc cierra la guía.</p>',
    },
  },
  {
    element: '#tour-observation-context', prepare: callbacks.onResetView,
    popover: {
      title: 'Tu observación actual', side: 'right', align: 'start',
      description: '<p>Aquí se muestran la variable seleccionada, su fuente científica y su unidad. Este contexto cambia al elegir otra variable.</p>',
    },
  },
  {
    element: '[data-mode-trigger="layers"]', prepare: callbacks.onResetView,
    popover: {
      title: 'Cambiar variable', side: 'left', align: 'center',
      description: '<p>Abre Variables para elegir temperatura, vegetación, masa de agua y hielo o CO₂. El acento y la información de referencia siguen tu selección.</p>',
    },
  },
  {
    element: '[data-mode-trigger="view"]', prepare: callbacks.onResetView,
    popover: {
      title: 'Ajustar la escena', side: 'left', align: 'center',
      description: '<p>Desde Escena puedes activar la rotación, las estrellas, la retícula geográfica y la atmósfera.</p>',
    },
  },
  {
    element: '#mission-time-navigator', prepare: callbacks.onOpenTime,
    popover: {
      title: 'Recorrer los años', side: 'top', align: 'center',
      description: `<p>El archivo temporal está abierto. Selecciona un año entre ${SATELLITE_TIMELINE.startYear} y ${SATELLITE_TIMELINE.endYear}, o usa Recorrer para avanzar año a año.</p><p class="tour-hint">La textura terrestre es una referencia visual; no representa una imagen satelital de cada año.</p>`,
    },
  },
  {
    element: '#tour-detective-card', prepare: callbacks.onOpenInspector,
    popover: {
      title: 'Inspeccionar una ubicación', side: 'right', align: 'start',
      description: '<p>El inspector muestra las coordenadas de la ubicación seleccionada. También puedes abrirlo tocando un punto de la Tierra.</p><p class="tour-hint">La serie de ejemplo contiene datos sintéticos. El análisis estadístico regional sigue pendiente.</p>',
    },
  },
];

let stopActiveTour: (() => void) | null = null;

export const guidedTourService = {
  startMissionTour(callbacks: TourCallbacks = {}) {
    stopActiveTour?.();
    const controller = new AbortController();
    const steps = getMissionSteps(callbacks);
    let preparing = false;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      controller.abort();
      stopActiveTour = null;
      callbacks.onResetView?.();
      callbacks.onRunningChange?.(false);
      requestAnimationFrame(() => {
        if (!stopActiveTour) document.getElementById('tour-launch-button')?.focus({ preventScroll: true });
      });
      try { localStorage.setItem('nasa_mission_tour_seen', 'true'); } catch { /* Almacenamiento opcional. */ }
    };

    const goTo = async (index: number) => {
      if (preparing || finished || !steps[index]) return;
      preparing = true;
      // Cambiar el modo ANTES de que Driver resuelva y mida el elemento.
      steps[index].prepare?.();
      const target = await waitForTourTarget(steps[index].element, controller.signal);
      if (finished) return;
      preparing = false;
      if (!target) { tour.destroy(); finish(); return; }
      tour.drive(index);
    };

    const tour = driver({
      steps, popoverClass: 'instrument-tour-popover',
      showProgress: true, progressText: '{{current}} / {{total}}',
      nextBtnText: 'Siguiente', prevBtnText: 'Anterior', doneBtnText: 'Terminar',
      animate: false, smoothScroll: false, allowScroll: false,
      overlayColor: '#050706', overlayOpacity: 0.56,
      stagePadding: 6, stageRadius: 3, popoverOffset: 16,
      disableActiveInteraction: true,
      onNextClick: () => { void goTo((tour.getActiveIndex() ?? 0) + 1); },
      onPrevClick: () => { void goTo((tour.getActiveIndex() ?? 0) - 1); },
      onDoneClick: () => tour.destroy(),
      onPopoverRender: popover => {
        popover.closeButton.setAttribute('aria-label', 'Cerrar guía');
        popover.wrapper.setAttribute('data-ui-control', '');
      },
      onDestroyed: finish,
    });

    const stop = () => { tour.destroy(); finish(); };
    stopActiveTour = stop;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      stop();
    };
    window.addEventListener('keydown', handleEscape, { capture: true, signal: controller.signal });
    callbacks.onRunningChange?.(true);
    void goTo(0);
  },
  stopTour() { stopActiveTour?.(); },
};

export default guidedTourService;
