/**
 * Student glossary: the concepts needed to read a trend verdict.
 * Numbered list without icons or per-entry colors: readability comes first here.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import '../../styles/detective-modals.css';

interface DetectiveGlossaryModalProps {
  open: boolean;
  onClose: () => void;
}

interface GlossaryItem {
  term: string;
  definition: string;
  inPlainWords: string;
  /** Notice when the concept exists but the tool does not yet have its real data. */
  caveat?: string;
}

const GLOSSARY_ITEMS: readonly GlossaryItem[] = [
  {
    term: 'What is an anomaly?',
    definition: 'It is not the raw instrument value, but how far it departs from normal at that location. Normal is the average over a reference baseline: 1951–1980 for GISTEMP and 1991–2020 for MERRA-2 variables.',
    inPlainWords: 'If your usual grade is 80 and today you get 90, your anomaly is +10.',
  },
  {
    term: 'What is Sen’s slope?',
    definition: 'It is the rate of change per year. It is computed as the median of slopes between all pairs of years, so a single extreme year cannot pull it off.',
    inPlainWords: 'It tells how much the variable rises or falls each year without being misled by an isolated spike.',
  },
  {
    term: 'What are the Mann-Kendall test and p-value?',
    definition: 'It checks whether the series rises or falls persistently by comparing every year against all others. The p-value tells how often such a trend would appear by pure chance: if it is below 0.05—less than 1 time in 20—the trend is called significant.',
    inPlainWords: 'Significant does not mean large or severe: it means it is hard to explain as coincidence.',
  },
  {
    term: 'What is MERRA-2?',
    definition: 'It is a NASA reanalysis: a model that reconstructs the state of the atmosphere and surface by combining observations from satellites, weather balloons, and stations. Here it provides air temperature, precipitation, evaporation, and soil moisture since 1981.',
    inPlainWords: 'It is not a direct measurement: it is the most consistent reconstruction possible from many measurements.',
  },
  {
    term: 'What is NDVI?',
    definition: 'It is a vegetation index. Healthy plants absorb red light for photosynthesis and reflect infrared light; comparing the two estimates how much live vegetation is present. Values near 1 are dense forest and values near 0 are bare ground. Here it comes from MODIS aboard the Terra satellite, month by month since 2000.',
    inPlainWords: 'Higher NDVI means more green leaves.',
  },
  {
    term: 'What do GRACE and GRACE-FO measure?',
    definition: 'They are pairs of satellites flying in tandem that measure tiny variations in Earth’s gravity. When a glacier melts or an aquifer empties, there is less mass in that area and gravity drops slightly.',
    inPlainWords: 'It is like weighing the planet’s ice and groundwater from orbit.',
    caveat: 'In this tool, water and ice mass is still a demonstration scenario.',
  },
];

export function DetectiveGlossaryModal({ open, onClose }: DetectiveGlossaryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dossier-backdrop" onClick={onClose}>
      <div className="dossier" role="dialog" aria-modal="true" aria-labelledby="glossary-title"
        ref={dialogRef} tabIndex={-1} onClick={event => event.stopPropagation()}>
        <header className="dossier__header">
          <div>
            <p className="dossier__eyebrow">Glossary<span>{GLOSSARY_ITEMS.length} concepts</span></p>
            <h2 id="glossary-title">How to read a verdict</h2>
            <p className="dossier__lead">Just enough to understand what the tool claims and what it does not.</p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label="Close">
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <ol className="glossary-list scrollbar-instrument">
          {GLOSSARY_ITEMS.map((item, index) => (
            <li key={item.term} className="glossary-entry">
              <span className="glossary-entry__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.term}</h3>
                <p>{item.definition}</p>
                <p className="glossary-entry__plain"><span>In plain words</span>{item.inPlainWords}</p>
                {item.caveat && <p className="glossary-entry__caveat">{item.caveat}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
