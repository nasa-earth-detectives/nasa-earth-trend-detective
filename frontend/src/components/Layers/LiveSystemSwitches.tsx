import { InstrumentSwitch } from '../UI/InstrumentSwitch';

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
  return (
    <div className="live-systems-switches space-y-2">
      <InstrumentSwitch
        label="Ocean currents"
        description="Animated 3D marine flows (NASA ECCO/OSCAR)"
        checked={oceanFlowVisible}
        onChange={onOceanFlowChange}
      />
      <InstrumentSwitch
        label="3D Teleconnections"
        description="Orbital transport arcs (ENSO, AMOC, Sahara)"
        checked={teleconnectionsVisible}
        onChange={onTeleconnectionsChange}
      />
      <InstrumentSwitch
        label="Hotspot radar ripples"
        description="Expanding pulses over extreme climate anomalies"
        checked={radarRipplesVisible}
        onChange={onRadarRipplesChange}
      />
      <InstrumentSwitch
        label="Satellite constellation"
        description="Real-time orbits of Terra, Aqua, GRACE-FO, and OCO-2"
        checked={satellitesVisible}
        onChange={onSatellitesChange}
      />
    </div>
  );
}
