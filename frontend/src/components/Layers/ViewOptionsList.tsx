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

/** Each exposed switch controls an active scene capability. */
export function ViewOptionsList({
  autoRotate, starsVisible, gridVisible, atmosphereVisible,
  onAutoRotateChange, onStarsChange, onGridChange, onAtmosphereChange,
}: ViewOptionsListProps) {
  return (
    <div className="scene-instrument">
      <h3 className="instrument-kicker">Motion & references</h3>
      <InstrumentSwitch label="Auto-rotate" description="Idle camera rotation"
        checked={autoRotate} onChange={onAutoRotateChange} />
      <InstrumentSwitch label="Star field" description="Deep-space reference"
        checked={starsVisible} onChange={onStarsChange} />
      <InstrumentSwitch label="Geographic grid" description="Meridians and parallels"
        checked={gridVisible} onChange={onGridChange} />
      <h3 className="instrument-kicker scene-instrument__section">Planet visibility</h3>
      <InstrumentSwitch label="Atmosphere" description="Atmospheric rim"
        checked={atmosphereVisible} onChange={onAtmosphereChange} />
      <details className="instrument-future">
        <summary className="focus-ring" title="Capabilities included in the scene. Integrated does not indicate asset loading state.">
          Integrated visual system <span aria-hidden="true">+</span>
        </summary>
        <StatusRowList title="Integrated planet capabilities" rows={VISUAL_SYSTEM_ROWS.filter((row) => row.id !== 'atmosphere')} />
      </details>
    </div>
  );
}
