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
 * Controles interactivos para las dinámicas vivas del planeta y capas avanzadas.
 * Sustituye marcadores estáticos por controles operativos en tiempo real.
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
        label="Corrientes oceánicas"
        description="Flujos marinos animados en 3D (NASA ECCO/OSCAR)"
        checked={oceanFlowVisible}
        onChange={onOceanFlowChange}
      />
      <InstrumentSwitch
        label="Teleconexiones 3D"
        description="Arcos orbitales de transporte (ENSO, AMOC, Sahara)"
        checked={teleconnectionsVisible}
        onChange={onTeleconnectionsChange}
      />
      <InstrumentSwitch
        label="Ondas radar en hotspots"
        description="Pulsos expansivos sobre anomalías climáticas extremas"
        checked={radarRipplesVisible}
        onChange={onRadarRipplesChange}
      />
      <InstrumentSwitch
        label="Constelación satelital"
        description="Órbitas reales de Terra, Aqua, GRACE-FO y OCO-2"
        checked={satellitesVisible}
        onChange={onSatellitesChange}
      />
    </div>
  );
}
