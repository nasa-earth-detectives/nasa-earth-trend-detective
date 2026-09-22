import { useEffect, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import { SCIENTIFIC_OVERLAYS } from '../../config/climateLayers';
import type { LayerTab } from '../../hooks/useImmersiveUi';
import { VariableLayerList } from './VariableLayerList';
import { ViewOptionsList } from './ViewOptionsList';
import { StatusRowList } from './StatusRowList';
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
  onAutoRotateChange: (value: boolean) => void;
  onStarsChange: (value: boolean) => void;
  onGridChange: (value: boolean) => void;
  onAtmosphereChange: (value: boolean) => void;
}

const TABS: { id: LayerTab; label: string }[] = [
  { id: 'data', label: 'Datos' },
  { id: 'view', label: 'Vista' },
];

/** El instrumento abre junto a la navegación; nunca altera la escena WebGL. */
export function LayerPanel({
  id, open, onClose, activeTab, onTabChange, selectedVariable, onVariableSelect,
  autoRotate, starsVisible, gridVisible, atmosphereVisible,
  onAutoRotateChange, onStarsChange, onGridChange, onAtmosphereChange,
}: LayerPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

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
    if (event.key in offsets) next = (activeIndex + offsets[event.key] + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    onTabChange(TABS[next].id);
    panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <section ref={panelRef} id={id} aria-labelledby={id + '-title'} inert={!open}
      data-open={open} className="earth-instrument" aria-hidden={!open}>
      <span className="earth-instrument__handle" aria-hidden="true" />
      <header className="earth-instrument__header">
        <div>
          <p className="instrument-kicker">{activeTab === 'data' ? 'Catálogo de observación' : 'Referencias de escena'}</p>
          <h2 id={id + '-title'}>{activeTab === 'data' ? 'Lentes terrestres' : 'Órbita y visibilidad'}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar instrumento"
          className="instrument-close focus-ring"><X size={18} aria-hidden="true" /></button>
      </header>

      <div className="instrument-tabs" role="tablist" aria-label="Secciones del instrumento"
        onKeyDown={moveTab} data-active={activeIndex}>
        {TABS.map((tab) => (
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
          <VariableLayerList selected={selectedVariable} onSelect={onVariableSelect} />
          <details className="instrument-future">
            <summary className="focus-ring">Capas en desarrollo <span aria-hidden="true">+</span></summary>
            <StatusRowList title="Análisis espacial" rows={SCIENTIFIC_OVERLAYS} />
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
