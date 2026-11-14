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
    term: 'What is a Climate Anomaly?',
    definition: 'It is not the absolute thermometer temperature, but how much warmer or cooler a year was compared to the historical normal average (NASA 1951–1980 baseline period). A value of +1.5 °C means it was 1.5 degrees above normal.',
    studentTip: 'Example: If your usual grade average is 80 and today you score 90, your "positive anomaly" is +10.',
  },
  {
    icon: BarChart2,
    accent: '#00d2ff',
    term: 'What is Sen’s Slope?',
    definition: 'It is the true rate of change per year or per decade. Unlike a standard average straight line, Sen’s slope computes the median of all pairwise differences, so a single outlier year or extreme storm does not skew the result.',
    studentTip: 'It measures how fast the climate is rising or falling without being fooled by isolated spikes.',
  },
  {
    icon: CheckCircle2,
    accent: '#10b981',
    term: 'What are the Mann-Kendall Test and p-value?',
    definition: 'It is the detective’s test to rule out coincidence. It evaluates whether the series rises or falls persistently. If the p-value is less than 0.05 (p < 0.05), there is over 95% confidence that the change is real and not random chance.',
    studentTip: 'If p < 0.05, the change is mathematically verified.',
  },
  {
    icon: BookOpen,
    accent: '#10b981',
    term: 'What is NDVI (Vegetation Index)?',
    definition: 'It measures how green and alive a territory is. Healthy plants absorb red light for photosynthesis and strongly reflect infrared light. Values near 1 indicate dense rainforests; values near 0 indicate deserts or drought.',
    studentTip: 'Higher NDVI means greener leaves and healthier forests.',
  },
  {
    icon: HelpCircle,
    accent: '#ec4899',
    term: 'What is GRACE-FO Equivalent Water Mass?',
    definition: 'NASA’s twin satellites fly in tandem and measure tiny variations in Earth’s gravitational pull. When a glacier melts or an aquifer dries up, gravity decreases in that exact region.',
    studentTip: 'It is like "weighing" ice and groundwater across the entire planet from orbit.',
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
            <span className="detective-modal-eyebrow">Concept Guide for Students & Reviewers</span>
            <h2 id="glossary-title">Climate Detective Glossary</h2>
            <p className="detective-modal-desc">
              Statistical and biophysical concepts explained in accessible language following NASA guidelines.
            </p>
          </div>
          <button type="button" onClick={onClose} className="detective-modal-close focus-ring" aria-label="Close modal">
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
                  <strong>💡 In plain words:</strong> {item.studentTip}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
