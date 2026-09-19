import { Globe } from 'lucide-react';

interface HeaderProps {
  apiConnected: boolean;
  statusText: string;
}

export function Header({ apiConnected, statusText }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Globe className="w-8 h-8 text-cyan-400 animate-pulse" />
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            NASA Earth System Trend Detective
          </h1>
          <p className="text-xs text-slate-400">NASA International Space Apps Challenge 2026</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/60 px-3 py-1.5 rounded-full">
        <span className="flex h-2.5 w-2.5 relative">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              apiConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              apiConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="text-xs font-medium text-slate-300">{statusText}</span>
      </div>
    </header>
  );
}
