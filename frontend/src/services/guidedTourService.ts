import { driver, type DriveStep } from 'driver.js';
import { SATELLITE_TIMELINE } from '../config/climateLayers';
import { formatTemplate, getActiveLocale, getTranslations, type Locale } from '../i18n';
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

const getMissionSteps = (callbacks: TourCallbacks, locale: Locale): ObservationStep[] => {
  const { steps } = getTranslations(locale).tour;
  return [
    {
      element: '#tour-launch-button', prepare: callbacks.onResetView,
      popover: { title: steps.launchTitle, side: 'bottom', align: 'start', description: steps.launchBody },
    },
    {
      element: '#tour-observation-context', prepare: callbacks.onResetView,
      popover: { title: steps.contextTitle, side: 'right', align: 'start', description: steps.contextBody },
    },
    {
      element: '[data-mode-trigger="layers"]', prepare: callbacks.onResetView,
      popover: { title: steps.variableTitle, side: 'left', align: 'center', description: steps.variableBody },
    },
    {
      element: '[data-mode-trigger="view"]', prepare: callbacks.onResetView,
      popover: { title: steps.sceneTitle, side: 'left', align: 'center', description: steps.sceneBody },
    },
    {
      element: '#mission-time-navigator', prepare: callbacks.onOpenTime,
      popover: {
        title: steps.timeTitle, side: 'top', align: 'center',
        description: formatTemplate(steps.timeBody, {
          startYear: SATELLITE_TIMELINE.startYear,
          endYear: SATELLITE_TIMELINE.endYear,
        }),
      },
    },
    {
      element: '#tour-detective-card', prepare: callbacks.onOpenInspector,
      popover: { title: steps.inspectorTitle, side: 'right', align: 'start', description: steps.inspectorBody },
    },
  ];
};

let stopActiveTour: (() => void) | null = null;

export const guidedTourService = {
  startMissionTour(callbacks: TourCallbacks = {}, locale: Locale = getActiveLocale()) {
    stopActiveTour?.();
    const controller = new AbortController();
    const { tour: tourCopy } = getTranslations(locale);
    const steps = getMissionSteps(callbacks, locale);
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
      nextBtnText: tourCopy.next, prevBtnText: tourCopy.previous, doneBtnText: tourCopy.finish,
      animate: false, smoothScroll: false, allowScroll: false,
      overlayColor: '#050706', overlayOpacity: 0.56,
      stagePadding: 6, stageRadius: 3, popoverOffset: 16,
      disableActiveInteraction: true,
      onNextClick: () => { void goTo((tour.getActiveIndex() ?? 0) + 1); },
      onPrevClick: () => { void goTo((tour.getActiveIndex() ?? 0) - 1); },
      onDoneClick: () => tour.destroy(),
      onPopoverRender: popover => {
        popover.closeButton.setAttribute('aria-label', tourCopy.closeGuideAria);
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
