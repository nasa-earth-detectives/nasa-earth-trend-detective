import { useEffect, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import { OCEAN_COVERING_VARIABLES, SCIENTIFIC_OVERLAYS } from '../../config/climateLayers';
import type { LayerTab } from '../../hooks/useImmersiveUi';
import { VariableLayerList } from './VariableLayerList';
import { ViewOptionsList } from './ViewOptionsList';
import { StatusRowList } from './StatusRowList';
import { LiveSystemSwitches } from './LiveSystemSwitches';
import { ReadingModeControl } from './ReadingModeControl';
import type { GlobeReading, ObservationCoverage, ObservationLayerMode } from '../../types/observationLayer.types';
import { useI18n } from '../../i18n';
import '../../styles/layers.css';

interface LayerPanelProps {
  id: string;
  open: boolean;
  onClose: () => void;
  activeTab: LayerTab;
  onTabChange: (tab: LayerTab) => void;
  selectedVariable: ClimateVariable;
  onVariableSelect: (variable: ClimateVariable) => void;
  autoRotate: boolean;
  starsVisible: boolean;
  gridVisible: boolean;
  atmosphereVisible: boolean;
  oceanFlowVisible?: boolean;
  teleconnectionsVisible?: boolean;
  radarRipplesVisible?: boolean;
  satellitesVisible?: boolean;
  observationMode: ObservationLayerMode;
  onObservationModeChange: (value: ObservationLayerMode) => void;
  reading: GlobeReading;
  onReadingChange: (value: GlobeReading) => void;
  coverage: ObservationCoverage;
  onCoverageChange: (value: ObservationCoverage) => void;
  onAutoRotateChange: (value: boolean) => void;
  onStarsChange: (value: boolean) => void;
  onGridChange: (value: boolean) => void;
  onAtmosphereChange: (value: boolean) => void;
  onOceanFlowChange?: (value: boolean) => void;
  onTeleconnectionsChange?: (value: boolean) => void;
  onRadarRipplesChange?: (value: boolean) => void;
  onSatellitesChange?: (value: boolean) => void;
}

export function LayerPanel({
  id, open, onClose, activeTab, onTabChange, selectedVariable, onVariableSelect,
  autoRotate, starsVisible, gridVisible, atmosphereVisible,
  oceanFlowVisible = true, teleconnectionsVisible = true, radarRipplesVisible = true, satellitesVisible = true,
  observationMode, onObservationModeChange,
  reading, onReadingChange,
  coverage, onCoverageChange,
  onAutoRotateChange, onStarsChange, onGridChange, onAtmosphereChange,
  onOceanFlowChange = () => {}, onTeleconnectionsChange = () => {},
  onRadarRipplesChange = () => {}, onSatellitesChange = () => {},
}: LayerPanelProps) {
  const { t } = useI18n();
  const tabs: { id: LayerTab; label: string }[] = [
    { id: 'data', label: t.layers.tabData },
    { id: 'view', label: t.layers.tabView },
  ];
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    const panel = panelRef.current;
    if (open && !wasOpen.current) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      panel?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
    } else if (!open && wasOpen.current) {
      if (panel?.contains(document.activeElement) || document.activeElement === document.body) {
        triggerRef.current?.focus({ preventScroll: true });
      }
    }
    wasOpen.current = open;
  }, [open]);

  const moveTab = (event: KeyboardEvent<HTMLDivElement>) => {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next = activeIndex;
    if (event.key in offsets) next = (activeIndex + offsets[event.key] + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    onTabChange(tabs[next].id);
    panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <section ref={panelRef} id={id} aria-labelledby={id + '-title'} inert={!open}
      data-open={open} className="earth-instrument" aria-hidden={!open}>
      <span className="earth-instrument__handle" aria-hidden="true" />
      <header className="earth-instrument__header">
        <div>
          <p className="instrument-kicker">{activeTab === 'data' ? t.layers.kickerData : t.layers.kickerView}</p>
          <h2 id={id + '-title'}>{activeTab === 'data' ? t.layers.titleData : t.layers.titleView}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={t.layers.closeAria}
          className="instrument-close focus-ring"><X size={18} aria-hidden="true" /></button>
      </header>

      <div className="instrument-tabs" role="tablist" aria-label={t.layers.tabsAria}
        onKeyDown={moveTab} data-active={activeIndex}>
        {tabs.map((tab) => (
          <button type="button" key={tab.id} id={id + '-tab-' + tab.id} role="tab"
            aria-selected={tab.id === activeTab} aria-controls={id + '-content-' + tab.id}
            tabIndex={tab.id === activeTab ? 0 : -1} onClick={() => onTabChange(tab.id)}
            className="focus-ring">{tab.label}</button>
        ))}
        <span aria-hidden="true" className="instrument-tabs__indicator" />
      </div>

      <div className="earth-instrument__body scrollbar-instrument">
        <div id={id + '-content-data'} role="tabpanel" aria-labelledby={id + '-tab-data'}
          hidden={activeTab !== 'data'} className="instrument-tab-content">
          <ReadingModeControl reading={reading} onReadingChange={onReadingChange}
            observationMode={observationMode} onObservationModeChange={onObservationModeChange}
            coverage={coverage} onCoverageChange={onCoverageChange}
            showCoverage={OCEAN_COVERING_VARIABLES.has(selectedVariable)} />
          <VariableLayerList selected={selectedVariable} onSelect={onVariableSelect} />

          <div className="instrument-live-section" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="instrument-kicker" style={{ marginBottom: '0.6rem' }}>{t.layers.liveHeading}</h3>
            <LiveSystemSwitches
              oceanFlowVisible={oceanFlowVisible}
              teleconnectionsVisible={teleconnectionsVisible}
              radarRipplesVisible={radarRipplesVisible}
              satellitesVisible={satellitesVisible}
              onOceanFlowChange={onOceanFlowChange}
              onTeleconnectionsChange={onTeleconnectionsChange}
              onRadarRipplesChange={onRadarRipplesChange}
              onSatellitesChange={onSatellitesChange}
            />
          </div>

          <details className="instrument-future" style={{ marginTop: '0.85rem' }}>
            <summary className="focus-ring">{t.layers.matrixSummary} <span aria-hidden="true">+</span></summary>
            <StatusRowList title={t.layers.matrixAria} rows={SCIENTIFIC_OVERLAYS} />
          </details>
        </div>
        <div id={id + '-content-view'} role="tabpanel" aria-labelledby={id + '-tab-view'}
          hidden={activeTab !== 'view'} className="instrument-tab-content">
          <ViewOptionsList autoRotate={autoRotate} starsVisible={starsVisible}
            gridVisible={gridVisible} atmosphereVisible={atmosphereVisible}
            onAutoRotateChange={onAutoRotateChange} onStarsChange={onStarsChange}
            onGridChange={onGridChange} onAtmosphereChange={onAtmosphereChange} />
        </div>
      </div>
    </section>
  );
}
