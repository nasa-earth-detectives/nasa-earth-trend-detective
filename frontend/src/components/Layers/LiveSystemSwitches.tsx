import { InstrumentSwitch } from '../UI/InstrumentSwitch';
import { useI18n } from '../../i18n';

export interface LiveSystemSwitchesProps {
  oceanFlowVisible: boolean;
  teleconnectionsVisible: boolean;
  radarRipplesVisible: boolean;
  satellitesVisible: boolean;
  onOceanFlowChange: (visible: boolean) => void;
  onTeleconnectionsChange: (visible: boolean) => void;
  onRadarRipplesChange: (visible: boolean) => void;
  onSatellitesChange: (visible: boolean) => void;
}

/**
 * Interactive controls for live planetary dynamics and advanced layers.
 * Replaces static placeholders with real-time operational toggles.
 */
export function LiveSystemSwitches({
  oceanFlowVisible,
  teleconnectionsVisible,
  radarRipplesVisible,
  satellitesVisible,
  onOceanFlowChange,
  onTeleconnectionsChange,
  onRadarRipplesChange,
  onSatellitesChange,
}: LiveSystemSwitchesProps) {
  const { t } = useI18n();
  return (
    <div className="live-systems-switches space-y-2">
      <InstrumentSwitch
        label={t.layers.oceanLabel}
        description={t.layers.oceanDesc}
        checked={oceanFlowVisible}
        onChange={onOceanFlowChange}
      />
      <InstrumentSwitch
        label={t.layers.teleLabel}
        description={t.layers.teleDesc}
        checked={teleconnectionsVisible}
        onChange={onTeleconnectionsChange}
      />
      <InstrumentSwitch
        label={t.layers.radarLabel}
        description={t.layers.radarDesc}
        checked={radarRipplesVisible}
        onChange={onRadarRipplesChange}
      />
      <InstrumentSwitch
        label={t.layers.satLabel}
        description={t.layers.satDesc}
        checked={satellitesVisible}
        onChange={onSatellitesChange}
      />
    </div>
  );
}
