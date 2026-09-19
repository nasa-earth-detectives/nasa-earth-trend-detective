import { useEffect, useState } from 'react';
import { Activity, Globe, Database, Satellite } from 'lucide-react';

interface ApiHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export function App() {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ApiHealthResponse | null) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              NASA Earth System Trend Detective
            </h1>
            <p className="text-xs text-slate-400">NASA Space Apps Challenge 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.status === 'Healthy' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                health?.status === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-xs font-medium text-slate-300">
            {loading ? 'Conectando...' : health?.status === 'Healthy' ? 'API Online' : 'API Standalone'}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <Satellite className="w-6 h-6 text-cyan-400" />
            <h2 className="font-semibold text-slate-200">Visualización 3D</h2>
          </div>
          <p className="text-sm text-slate-400">
            Globo interactivo WebGL / Three.js con capas geoespaciales de temperatura, NDVI y anomalías.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h2 className="font-semibold text-slate-200">Análisis Estadístico</h2>
          </div>
          <p className="text-sm text-slate-400">
            Detección rigurosa de tendencias climáticas multianuales con tests de Mann-Kendall y Sen's Slope.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-6 h-6 text-purple-400" />
            <h2 className="font-semibold text-slate-200">Motor DuckDB</h2>
          </div>
          <p className="text-sm text-slate-400">
            Base analítica OLAP columnar integrada en backend .NET 10 para consultas analíticas de alta velocidad.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
