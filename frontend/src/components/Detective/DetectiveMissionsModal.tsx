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
    title: 'Arctic Amplification',
    tag: 'Real GISTEMP Data',
    icon: Flame,
    accent: '#ff5533',
    variable: 'Gistemp',
    location: { lat: 73.0, lng: -40.0 },
    year: 2024,
    highlightText: '+0.72 °C / decade (p < 0.001)',
    description: 'Polar warming exceeds the global average by 4x due to sea ice albedo reflectivity loss.',
    scientificContext: 'GISTEMP v4 · Real NASA Observation',
  },
  {
    id: 'greenland-ice-melt',
    title: 'Greenland Ice Melt',
    tag: 'GRACE Satellite Mass',
    icon: Snowflake,
    accent: '#00d2ff',
    variable: 'GraceMass',
    location: { lat: 71.0, lng: -42.5 },
    year: 2023,
    highlightText: '-262 Gt / year loss',
    description: 'Micro-anomalies in Earth’s gravitational field confirm sustained ice-sheet mass loss.',
    scientificContext: 'GRACE / GRACE-FO · NASA/GFZ Gravity Mission',
  },
  {
    id: 'sahel-greening',
    title: 'Sahel Greening',
    tag: 'MODIS Vegetation',
    icon: Trees,
    accent: '#10b981',
    variable: 'ModisNdvi',
    location: { lat: 14.5, lng: 1.5 },
    year: 2022,
    highlightText: '+0.015 NDVI / decade',
    description: 'Increased leaf vigor on the southern edge of the Sahara driven by meridional shifts in the monsoon rain belt.',
    scientificContext: 'MODIS Terra/Aqua · NDVI Vegetation Index',
  },
  {
    id: 'mauna-loa-co2',
    title: 'CO₂ Forcing at Mauna Loa',
    tag: 'OCO-2 Spectrometry',
    icon: Factory,
    accent: '#ec4899',
    variable: 'Oco2',
    location: { lat: 19.5, lng: -155.5 },
    year: 2024,
    highlightText: '> 422 ppm column average',
    description: 'Mean tropospheric carbon dioxide mole fraction showing an unprecedented monotonic upward trend.',
    scientificContext: 'OCO-2 / OCO-3 · NASA Grating Spectrometer',
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
            <span className="detective-modal-eyebrow">NASA Space Apps 2026 · Official Demo</span>
            <h2 id="missions-title">Preconfigured Detective Missions</h2>
            <p className="detective-modal-desc">
              Select a case study to fly the camera directly to the exact coordinates and analyze the evidence.
            </p>
          </div>
          <button type="button" onClick={onClose} className="detective-modal-close focus-ring" aria-label="Close modal">
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
                  <span className="detective-mission-year">Year {mission.year}</span>
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
                  <span>Investigate case</span>
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
