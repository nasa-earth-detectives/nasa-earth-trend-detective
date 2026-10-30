import { useEffect, useRef } from 'react';
import { X, Flame, Snowflake, Trees, Factory, ChevronRight } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import '../../styles/detective-modals.css';

export interface MissionPreset {
  id: string;
  title: string;
  tag: string;
  icon: typeof Flame;
  accent: string;
  variable: ClimateVariable;
  location: SelectedLocation;
  year: number;
  highlightText: string;
  description: string;
  scientificContext: string;
}

export const DEMO_MISSIONS: MissionPreset[] = [
  {
    id: 'arctic-amplification',
    title: 'Amplificación Ártica',
    tag: 'Datos Reales GISTEMP',
    icon: Flame,
    accent: '#ff5533',
    variable: 'Gistemp',
    location: { lat: 73.0, lng: -40.0 },
    year: 2024,
    highlightText: '+0.72 °C / década (p < 0.001)',
    description: 'El calentamiento polar supera por 4x el promedio global debido a la pérdida de reflectividad albedo en el hielo marino.',
    scientificContext: 'GISTEMP v4 · Observación Real de la NASA',
  },
  {
    id: 'greenland-ice-melt',
    title: 'Deshielo en Groenlandia',
    tag: 'Masa Satelital GRACE',
    icon: Snowflake,
    accent: '#00d2ff',
    variable: 'GraceMass',
    location: { lat: 71.0, lng: -42.5 },
    year: 2023,
    highlightText: '-262 Gt / año de pérdida',
    description: 'Micro-anomalías del campo gravitatorio terrestre confirman el desprendimiento sostenido de los casquetes glaciares.',
    scientificContext: 'GRACE / GRACE-FO · Misión de Gravedad NASA/GFZ',
  },
  {
    id: 'sahel-greening',
    title: 'Reverdecimiento del Sahel',
    tag: 'Vegetación MODIS',
    icon: Trees,
    accent: '#10b981',
    variable: 'ModisNdvi',
    location: { lat: 14.5, lng: 1.5 },
    year: 2022,
    highlightText: '+0.015 NDVI / década',
    description: 'Aumento de vigor foliar en el borde sur del Sahara por variaciones meridionales en el cinturón de lluvias monzónicas.',
    scientificContext: 'MODIS Terra/Aqua · Índice de Vegetación NDVI',
  },
  {
    id: 'mauna-loa-co2',
    title: 'Forzamiento por CO₂ en Mauna Loa',
    tag: 'Espectrometría OCO-2',
    icon: Factory,
    accent: '#ec4899',
    variable: 'Oco2',
    location: { lat: 19.5, lng: -155.5 },
    year: 2024,
    highlightText: '> 422 ppm en columna',
    description: 'Fracción molar media de dióxido de carbono troposférico con tendencia monotónica creciente sin precedentes.',
    scientificContext: 'OCO-2 / OCO-3 · Espectrómetro de Rejilla NASA',
  },
];

interface DetectiveMissionsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMission: (mission: MissionPreset) => void;
}

export function DetectiveMissionsModal({ open, onClose, onSelectMission }: DetectiveMissionsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="detective-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="missions-title">
      <div className="detective-modal-card" onClick={e => e.stopPropagation()} ref={modalRef}>
        <header className="detective-modal-header">
          <div>
            <span className="detective-modal-eyebrow">NASA Space Apps 2026 · Demostración Oficial</span>
            <h2 id="missions-title">Misiones de Detective Preconfiguradas</h2>
            <p className="detective-modal-desc">
              Selecciona un caso de estudio para volar inmediatamente la cámara a la coordenada exacta y analizar la evidencia.
            </p>
          </div>
          <button type="button" onClick={onClose} className="detective-modal-close focus-ring" aria-label="Cerrar ventana">
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        <div className="detective-missions-grid">
          {DEMO_MISSIONS.map(mission => {
            const Icon = mission.icon;
            return (
              <article key={mission.id} className="detective-mission-item" style={{ '--card-accent': mission.accent } as React.CSSProperties}>
                <div className="detective-mission-top">
                  <div className="detective-mission-badge" style={{ borderColor: mission.accent, color: mission.accent }}>
                    <Icon size={14} />
                    <span>{mission.tag}</span>
                  </div>
                  <span className="detective-mission-year">Año {mission.year}</span>
                </div>

                <h3>{mission.title}</h3>
                <p className="detective-mission-highlight">{mission.highlightText}</p>
                <p className="detective-mission-body">{mission.description}</p>
                <p className="detective-mission-meta">{mission.scientificContext}</p>

                <button
                  type="button"
                  className="detective-mission-launch-btn focus-ring"
                  onClick={() => {
                    onSelectMission(mission);
                    onClose();
                  }}
                >
                  <span>Investigar caso</span>
                  <ChevronRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
