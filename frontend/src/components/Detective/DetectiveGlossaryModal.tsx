/**
 * Glosario para estudiantes: los conceptos que hacen falta para leer un veredicto de tendencia.
 * Lista numerada sin iconos ni colores por entrada: aquí lo que importa es que se lea bien.
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
  /** Aviso cuando el concepto existe pero la herramienta todavía no tiene sus datos reales. */
  caveat?: string;
}

const GLOSSARY_ITEMS: readonly GlossaryItem[] = [
  {
    term: '¿Qué es una anomalía?',
    definition: 'No es el valor que marca el instrumento, sino cuánto se aparta de lo normal en ese lugar. Lo normal es el promedio de un periodo de referencia: 1951–1980 en GISTEMP y 1991–2020 en las variables de MERRA-2.',
    inPlainWords: 'Si tu nota habitual es 80 y hoy sacas 90, tu anomalía es +10.',
  },
  {
    term: '¿Qué es la pendiente de Sen?',
    definition: 'Es el ritmo de cambio por año. Se calcula como la mediana de las pendientes entre todos los pares de años, de modo que un solo año extremo no la arrastra.',
    inPlainWords: 'Dice cuánto sube o baja la variable cada año sin dejarse engañar por un pico aislado.',
  },
  {
    term: '¿Qué es la prueba de Mann-Kendall y el valor p?',
    definition: 'Comprueba si la serie sube o baja de forma persistente comparando cada año con todos los demás. El valor p dice con qué frecuencia aparecería una tendencia así por puro azar: si es menor que 0,05, menos de 1 vez de cada 20, la tendencia se llama significativa.',
    inPlainWords: 'Significativa no quiere decir grande ni grave: quiere decir que es difícil explicarla como casualidad.',
  },
  {
    term: '¿Qué es MERRA-2?',
    definition: 'Es un reanálisis de la NASA: un modelo que reconstruye el estado de la atmósfera y de la superficie combinando observaciones de satélites, globos y estaciones. Aquí aporta la temperatura del aire, la precipitación, la evaporación y la humedad del suelo desde 1981.',
    inPlainWords: 'No es una medición directa: es la reconstrucción más coherente que se puede hacer con muchas mediciones.',
  },
  {
    term: '¿Qué es el NDVI?',
    definition: 'Es un índice de vegetación. Las plantas sanas absorben la luz roja para hacer la fotosíntesis y reflejan la infrarroja; comparando las dos se estima cuánta vegetación viva hay. Los valores cercanos a 1 son selva densa y los cercanos a 0, suelo desnudo. Aquí viene de MODIS, a bordo del satélite Terra, mes a mes desde 2000.',
    inPlainWords: 'A mayor NDVI, más hojas verdes.',
  },
  {
    term: '¿Qué miden GRACE y GRACE-FO?',
    definition: 'Son parejas de satélites que vuelan uno detrás de otro y miden variaciones mínimas en la gravedad de la Tierra. Cuando un glaciar se derrite o un acuífero se vacía, hay menos masa en esa zona y la gravedad baja un poco.',
    inPlainWords: 'Es como pesar el hielo y el agua subterránea del planeta desde la órbita.',
    caveat: 'En esta herramienta la masa de agua y hielo es todavía un escenario de demostración.',
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
            <p className="dossier__eyebrow">Glosario<span>{GLOSSARY_ITEMS.length} conceptos</span></p>
            <h2 id="glossary-title">Cómo leer un veredicto</h2>
            <p className="dossier__lead">Lo justo para entender qué afirma la herramienta y qué no.</p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label="Cerrar">
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
                <p className="glossary-entry__plain"><span>En palabras sencillas</span>{item.inPlainWords}</p>
                {item.caveat && <p className="glossary-entry__caveat">{item.caveat}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
