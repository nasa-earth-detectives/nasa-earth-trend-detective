import { useEffect, useRef } from 'react';
import { X, BookOpen, HelpCircle, Activity, BarChart2, CheckCircle2 } from 'lucide-react';
import '../../styles/detective-modals.css';

interface DetectiveGlossaryModalProps {
  open: boolean;
  onClose: () => void;
}

const GLOSSARY_ITEMS = [
  {
    icon: Activity,
    accent: '#ff5533',
    term: '¿Qué es una Anomalía Climática?',
    definition: 'No es la temperatura absoluta del termómetro, sino qué tan más caliente o frío estuvo un año respecto al promedio normal histórico (período base 1951-1980 de la NASA). Un valor de +1.5 °C significa que estuvo 1.5 grados por encima de lo usual.',
    studentTip: 'Ejemplo: Si tu promedio normal de notas es 80 y hoy sacas 90, tu "anomalía positiva" es +10.',
  },
  {
    icon: BarChart2,
    accent: '#00d2ff',
    term: '¿Qué es la Pendiente de Sen (Sen\'s Slope)?',
    definition: 'Es el ritmo de cambio real por año o por década. A diferencia de una línea recta promedio común, la pendiente de Sen calcula la mediana de todas las diferencias, por lo que un solo año atípico o tormenta extrema no altera el cálculo.',
    studentTip: 'Mide la velocidad a la que el clima sube o baja sin dejarse engañar por picos aislados.',
  },
  {
    icon: CheckCircle2,
    accent: '#10b981',
    term: '¿Qué es el Test de Mann-Kendall y el valor p?',
    definition: 'Es la prueba del detective para descartar coincidencias. Evalúa si la serie sube o baja de forma persistente. Si el valor p es menor a 0.05 (p < 0.05), significa que hay más del 95% de certeza de que el cambio es real y no simple casualidad.',
    studentTip: 'Si p < 0.05, el cambio está matemáticamente comprobado.',
  },
  {
    icon: BookOpen,
    accent: '#10b981',
    term: '¿Qué es el NDVI (Índice de Vegetación)?',
    definition: 'Mide qué tan verde y vivo está un territorio. Las plantas sanas absorben luz roja para hacer fotosíntesis y reflejan fuertemente la luz infrarroja. Valores cercanos a 1 indican selvas densas; valores cercanos a 0 indican desiertos o sequía.',
    studentTip: 'A mayor NDVI, más hojas verdes y bosques saludables.',
  },
  {
    icon: HelpCircle,
    accent: '#ec4899',
    term: '¿Qué es la masa equivalente de GRACE-FO?',
    definition: 'Los satélites gemelos de la NASA vuelan en tándem y miden microvariaciones en la atracción gravitatoria de la Tierra. Cuando un glaciar se derrite o un acuífero se seca, la gravedad disminuye en esa región exacta.',
    studentTip: 'Es como "pesar" el hielo y el agua subterránea de todo el planeta desde la órbita.',
  },
];

export function DetectiveGlossaryModal({ open, onClose }: DetectiveGlossaryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="detective-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="glossary-title">
      <div className="detective-modal-card" onClick={e => e.stopPropagation()} ref={modalRef}>
        <header className="detective-modal-header">
          <div>
            <span className="detective-modal-eyebrow">Guía de Conceptos para Estudiantes y Evaluadores</span>
            <h2 id="glossary-title">Glosario del Detective Climático</h2>
            <p className="detective-modal-desc">
              Conceptos estadísticos y biofísicos explicados en lenguaje accesible según los lineamientos de la NASA.
            </p>
          </div>
          <button type="button" onClick={onClose} className="detective-modal-close focus-ring" aria-label="Cerrar ventana">
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        <div className="detective-glossary-list">
          {GLOSSARY_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="detective-glossary-card">
                <div className="detective-glossary-card-header">
                  <div className="detective-glossary-icon" style={{ color: item.accent }}>
                    <Icon size={18} />
                  </div>
                  <h3>{item.term}</h3>
                </div>
                <p className="detective-glossary-def">{item.definition}</p>
                <div className="detective-glossary-tip">
                  <strong>💡 En palabras sencillas:</strong> {item.studentTip}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
