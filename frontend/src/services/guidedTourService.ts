import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TourCallbacks {
  onOpenInspector?: () => void;
  onCloseInspector?: () => void;
}

/**
 * Genera el encabezado HTML personalizado con la insignia y telemetría de misión espacial
 */
const renderCosmicPopoverHeader = (title: string, badge = '🛰️ Misión NASA') => `
  <div class="tour-cosmic-header">
    <div class="tour-cosmic-icon-wrapper">
      <span class="tour-cosmic-pulse"></span>
      <span class="tour-cosmic-symbol">🛰️</span>
    </div>
    <div class="tour-cosmic-meta">
      <strong class="tour-cosmic-title">${title}</strong>
      <span class="tour-cosmic-badge">${badge}</span>
    </div>
  </div>
`;

/**
 * Define los pasos de la expedición orbital
 */
const getMissionSteps = (callbacks?: TourCallbacks): DriveStep[] => [
  {
    element: '#tour-mission-header',
    popover: {
      title: renderCosmicPopoverHeader('Control de Misión & Telemetría', '🛰️ Estación Orbital'),
      description: `
        <div class="tour-cosmic-content">
          <p>Bienvenido a <strong>Trend Detective</strong>, la plataforma orbital de análisis climático del <em>NASA Space Apps Challenge</em>.</p>
          <p>Desde esta insignia monitoreas el estado en tiempo real de la misión y puedes volver a activar este recorrido interactivo en cualquier momento con el botón <strong>"Guía de Misión"</strong>.</p>
          <div class="tour-cosmic-tip">💡 Usa los botones <strong>Siguiente ➔</strong> o las flechas de tu teclado (⬅ / ➔) para navegar.</div>
        </div>
      `,
      side: 'bottom',
      align: 'start',
      popoverClass: 'cosmic-driver-popover',
    },
  },
  {
    element: '#tour-observation-context',
    popover: {
      title: renderCosmicPopoverHeader('Coordenadas & Dominio Activo', '📡 Sensor Satelital'),
      description: `
        <div class="tour-cosmic-content">
          <p>Aquí se reporta la telemetría del instrumento satelital activo (misiones <strong>MODIS, CERES, Landsat</strong> y reanálisis orbital).</p>
          <p>Supervisa la variable física bajo estudio, su unidad de medida y el ámbito de observación global en tiempo real.</p>
        </div>
      `,
      side: 'bottom',
      align: 'start',
      popoverClass: 'cosmic-driver-popover',
    },
  },
  {
    element: '#tour-mode-navigator',
    popover: {
      title: renderCosmicPopoverHeader('Instrumentos de Navegación', '🧭 Barra de Control'),
      description: `
        <div class="tour-cosmic-content">
          <p>Barra de control orbital para alternar entre los modos de visualización:</p>
          <p>• <strong>Variables:</strong> Capas climáticas (temperatura, ozono, CO₂, vegetación).<br/>
             • <strong>Tiempo:</strong> Navegación histórica interanual.<br/>
             • <strong>Escena:</strong> Control de rotación terrestre, estrellas y atmósfera.<br/>
             • <strong>Inspeccionar:</strong> Fija el visor en una región de la superficie.</p>
        </div>
      `,
      side: 'right',
      align: 'center',
      popoverClass: 'cosmic-driver-popover',
    },
  },
  {
    element: '#tour-time-navigator',
    popover: {
      title: renderCosmicPopoverHeader('Línea Temporal (2000 - 2026)', '⏱️ Análisis Multitemporal'),
      description: `
        <div class="tour-cosmic-content">
          <p>Explora más de dos décadas de registros satelitales calibrados por la NASA.</p>
          <p>Puedes arrastrar el selector de años o presionar el botón de <strong>Reproducción</strong> para animar la transformación bioclimática del planeta de forma continua.</p>
        </div>
      `,
      side: 'top',
      align: 'center',
      popoverClass: 'cosmic-driver-popover',
    },
  },
  {
    element: '#tour-detective-card',
    popover: {
      title: renderCosmicPopoverHeader('Inspector Científico: Trend Detective', '🔬 Rigor Estadístico'),
      description: `
        <div class="tour-cosmic-content">
          <p>El núcleo de investigación climática: ejecuta el test no paramétrico de <strong>Mann-Kendall</strong> y la pendiente mediana de <strong>Sen</strong>.</p>
          <p>• <strong>Insignia de Significancia:</strong> Evalúa el p-valor estadístico (< 0.05).<br/>
             • <strong>Serie Temporal Interactiva:</strong> Gráfico SVG con gradiente que proyecta la evolución anual y la línea de tendencia calculada.</p>
          <div class="tour-cosmic-congrats">🚀 ¡Listo para investigar! Haz clic en cualquier punto de la Tierra para comenzar el análisis.</div>
        </div>
      `,
      side: 'left',
      align: 'center',
      popoverClass: 'cosmic-driver-popover',
    },
    onHighlightStarted: () => {
      callbacks?.onOpenInspector?.();
    },
  },
];

let activeDriverInstance: Driver | null = null;

export const guidedTourService = {
  /**
   * Inicia el Tour Interactivo de Misión Espacial
   */
  startMissionTour: (callbacks?: TourCallbacks) => {
    if (activeDriverInstance) {
      activeDriverInstance.destroy();
    }

    const steps = getMissionSteps(callbacks);

    activeDriverInstance = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(3, 7, 18, 0.86)',
      stagePadding: 8,
      stageRadius: 14,
      nextBtnText: 'Siguiente ➔',
      prevBtnText: '⬅ Anterior',
      doneBtnText: '✓ Finalizar Misión',
      allowClose: true,
      steps,
      onDestroyed: () => {
        activeDriverInstance = null;
        try {
          localStorage.setItem('nasa_mission_tour_seen', 'true');
        } catch {
          // LocalStorage fallback en entornos restringidos
        }
      },
    });

    activeDriverInstance.drive();
  },

  /**
   * Detiene el tour activo
   */
  stopTour: () => {
    if (activeDriverInstance) {
      activeDriverInstance.destroy();
      activeDriverInstance = null;
    }
  },
};

export default guidedTourService;
