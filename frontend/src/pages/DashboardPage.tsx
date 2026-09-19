import { useState, useEffect } from 'react';
import { Header } from '../components/Common/Header';
import { MetricCard } from '../components/Cards/MetricCard';
import { TimeSlider } from '../components/Controls/TimeSlider';
import { GlobeViewer } from '../components/Globe/GlobeViewer';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';
import { VariableMetadata } from '../types/climate.types';
import { trendService } from '../services/trendService';

const AVAILABLE_VARIABLES: VariableMetadata[] = [
  {
    id: 'Gistemp',
    name: 'Temperatura Superficial',
    satelliteMission: 'NASA GISTEMP v4',
    unit: '°C Anomaly',
    description: 'Anomalías de temperatura combinadas tierra-océano con referencia histórica.',
    colorScheme: 'Thermal',
  },
  {
    id: 'ModisNdvi',
    name: 'Índice de Vegetación (NDVI)',
    satelliteMission: 'Terra/Aqua MODIS',
    unit: 'NDVI (-1 a 1)',
    description: 'Vigor fotosintético y cobertura de biomasa vegetal global.',
    colorScheme: 'Vegetation',
  },
  {
    id: 'GraceMass',
    name: 'Masa de Agua y Glaciares',
    satelliteMission: 'GRACE / GRACE-FO',
    unit: 'cm H2O equiv.',
    description: 'Anomalías gravitatorias de reservas de agua subterránea y capas de hielo.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Oco2',
    name: 'Dióxido de Carbono (CO₂)',
    satelliteMission: 'OCO-2 / OCO-3',
    unit: 'ppm',
    description: 'Fracción molar de CO₂ en columna atmosférica total (XCO₂).',
    colorScheme: 'Atmospheric',
  },
];

export function DashboardPage() {
  const { filter, setVariable, setYearRange } = useTrendFilter('Gistemp');
  const { data: observations, loading } = useGlobeData(filter);
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  useEffect(() => {
    trendService
      .getHealth()
      .then((res) => setApiConnected(res.status === 'Healthy'))
      .catch(() => setApiConnected(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        apiConnected={apiConnected}
        statusText={apiConnected ? 'API .NET 10 Online' : 'Modo Standalone'}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col gap-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AVAILABLE_VARIABLES.map((meta) => (
            <MetricCard
              key={meta.id}
              metadata={meta}
              selected={filter.variable === meta.id}
              onSelect={setVariable}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <GlobeViewer observations={observations} loading={loading} />
            <TimeSlider
              startYear={2002}
              endYear={2024}
              currentYear={filter.endYear}
              onChange={(y) => setYearRange(filter.startYear, y)}
            />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-2">
                Motor Analítico de Tendencias
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                La plataforma procesa series temporales biofísicas utilizando el test no paramétrico de
                Mann-Kendall y el estimador robusto de Pendiente de Sen (Sen's Slope).
              </p>
              <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-950/60 mb-3">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase">Variable Activa</span>
                <p className="text-sm font-medium text-slate-200">{filter.variable}</p>
              </div>
              <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-950/60">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">Rango de Análisis</span>
                <p className="text-sm font-medium text-slate-200">{filter.startYear} - {filter.endYear}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4">
              NASA International Space Apps Challenge 2026 - Earth Science Team
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
