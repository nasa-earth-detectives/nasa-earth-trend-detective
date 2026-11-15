import { VISUAL_SYSTEM_ROWS } from '../../config/climateLayers';
import { InstrumentSwitch } from '../UI/InstrumentSwitch';
import { StatusRowList } from './StatusRowList';
import { useI18n } from '../../i18n';

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
  const { t } = useI18n();
  return (
    <div className="scene-instrument">
      <h3 className="instrument-kicker">{t.layers.motionHeading}</h3>
      <InstrumentSwitch label={t.layers.autoRotateLabel} description={t.layers.autoRotateDesc}
        checked={autoRotate} onChange={onAutoRotateChange} />
      <InstrumentSwitch label={t.layers.starsLabel} description={t.layers.starsDesc}
        checked={starsVisible} onChange={onStarsChange} />
      <InstrumentSwitch label={t.layers.gridLabel} description={t.layers.gridDesc}
        checked={gridVisible} onChange={onGridChange} />
      <h3 className="instrument-kicker scene-instrument__section">{t.layers.visibilityHeading}</h3>
      <InstrumentSwitch label={t.layers.atmosphereLabel} description={t.layers.atmosphereDesc}
        checked={atmosphereVisible} onChange={onAtmosphereChange} />
      <details className="instrument-future">
        <summary className="focus-ring" title={t.layers.integratedTitle}>
          {t.layers.integratedSummary} <span aria-hidden="true">+</span>
        </summary>
        <StatusRowList title={t.layers.integratedAria} rows={VISUAL_SYSTEM_ROWS.filter((row) => row.id !== 'atmosphere')} />
      </details>
    </div>
  );
}
