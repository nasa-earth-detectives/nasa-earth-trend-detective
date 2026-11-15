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
      title: 'Observation Guide', side: 'bottom', align: 'start',
      description: '<p>This button opens the Trend Detective instrument guide.</p><p class="tour-hint">Advance with Next or your keyboard arrow keys. Esc closes the guide.</p>',
    },
  },
  {
    element: '#tour-observation-context', prepare: callbacks.onResetView,
    popover: {
      title: 'Your Current Observation', side: 'right', align: 'start',
      description: '<p>This shows the selected variable, its scientific source, and its unit. This context updates when you choose another variable.</p>',
    },
  },
  {
    element: '[data-mode-trigger="layers"]', prepare: callbacks.onResetView,
    popover: {
      title: 'Switch Variable', side: 'left', align: 'center',
      description: '<p>Open Variables to choose surface temperature, vegetation, water & ice mass, or CO₂. The accent color and reference details follow your selection.</p>',
    },
  },
  {
    element: '[data-mode-trigger="view"]', prepare: callbacks.onResetView,
    popover: {
      title: 'Adjust the Scene', side: 'left', align: 'center',
      description: '<p>From Scene you can toggle rotation, stars, geographic grid, and atmosphere.</p>',
    },
  },
  {
    element: '#mission-time-navigator', prepare: callbacks.onOpenTime,
    popover: {
      title: 'Browse Through Years', side: 'top', align: 'center',
      description: `<p>The time archive is open. Select a year between ${SATELLITE_TIMELINE.startYear} and ${SATELLITE_TIMELINE.endYear}, or use Play to step year by year.</p><p class="tour-hint">The Earth texture is a visual reference; it does not represent a satellite image of each year.</p>`,
    },
  },
  {
    element: '#tour-detective-card', prepare: callbacks.onOpenInspector,
    popover: {
      title: 'Inspect a Location', side: 'right', align: 'start',
      description: '<p>The inspector displays the coordinates of the selected location. You can also open it by clicking any point on Earth.</p><p class="tour-hint">The verdict uses Mann–Kendall and Sen’s slope on the annual series. If no observed data is available, the app states this instead of fabricating values.</p>',
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
      try { localStorage.setItem('nasa_mission_tour_seen', 'true'); } catch { /* Optional storage. */ }
    };

    const goTo = async (index: number) => {
      if (preparing || finished || !steps[index]) return;
      preparing = true;
      // Change mode BEFORE Driver resolves and measures the element.
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
      nextBtnText: 'Next', prevBtnText: 'Previous', doneBtnText: 'Finish',
      animate: false, smoothScroll: false, allowScroll: false,
      overlayColor: '#050706', overlayOpacity: 0.56,
      stagePadding: 6, stageRadius: 3, popoverOffset: 16,
      disableActiveInteraction: true,
      onNextClick: () => { void goTo((tour.getActiveIndex() ?? 0) + 1); },
      onPrevClick: () => { void goTo((tour.getActiveIndex() ?? 0) - 1); },
      onDoneClick: () => tour.destroy(),
      onPopoverRender: popover => {
        popover.closeButton.setAttribute('aria-label', 'Close guide');
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
