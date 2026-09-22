import { VISUAL_SYSTEM_ROWS } from '../../config/climateLayers';
import { InstrumentSwitch } from '../UI/InstrumentSwitch';
import { StatusRowList } from './StatusRowList';

interface ViewOptionsListProps {
  autoRotate: boolean;
  starsVisible: boolean;
  gridVisible: boolean;
  atmosphereVisible: boolean;
  onAutoRotateChange: (value: boolean) => void;
  onStarsChange: (value: boolean) => void;
  onGridChange: (value: boolean) => void;
  onAtmosphereChange: (value: boolean) => void;
}

/** Cada interruptor expuesto controla una capacidad presente de la escena. */
export function ViewOptionsList({
  autoRotate, starsVisible, gridVisible, atmosphereVisible,
  onAutoRotateChange, onStarsChange, onGridChange, onAtmosphereChange,
}: ViewOptionsListProps) {
  return (
    <div className="scene-instrument">
      <h3 className="instrument-kicker">Movimiento y referencias</h3>
      <InstrumentSwitch label="Rotación automática" description="Giro del planeta en reposo"
        checked={autoRotate} onChange={onAutoRotateChange} />
      <InstrumentSwitch label="Campo estelar" description="Referencia del espacio exterior"
        checked={starsVisible} onChange={onStarsChange} />
      <InstrumentSwitch label="Retícula geográfica" description="Meridianos y paralelos"
        checked={gridVisible} onChange={onGridChange} />
      <h3 className="instrument-kicker scene-instrument__section">Visibilidad del planeta</h3>
      <InstrumentSwitch label="Atmósfera" description="Contorno atmosférico"
        checked={atmosphereVisible} onChange={onAtmosphereChange} />
      <details className="instrument-future">
        <summary className="focus-ring">Capacidades en desarrollo <span aria-hidden="true">+</span></summary>
        <StatusRowList title="Sistema visual" rows={VISUAL_SYSTEM_ROWS.filter((row) => !row.active)} />
      </details>
    </div>
  );
}
