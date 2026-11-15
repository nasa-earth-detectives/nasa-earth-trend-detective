/**
 * Student glossary: the concepts needed to read a trend verdict.
 * Numbered list without icons or per-entry colors: readability comes first here.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import '../../styles/detective-modals.css';

import { formatTemplate, useI18n } from '../../i18n';

interface DetectiveGlossaryModalProps {
  open: boolean;
  onClose: () => void;
}

export function DetectiveGlossaryModal({ open, onClose }: DetectiveGlossaryModalProps) {
  const { t } = useI18n();
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
            <p className="dossier__eyebrow">{t.modals.glossaryEyebrow}<span>{formatTemplate(t.modals.glossaryCount, { count: t.glossaryItems.length })}</span></p>
            <h2 id="glossary-title">{t.modals.glossaryTitle}</h2>
            <p className="dossier__lead">{t.modals.glossaryLead}</p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label={t.modals.closeAria}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <ol className="glossary-list scrollbar-instrument">
          {t.glossaryItems.map((item, index) => (
            <li key={item.term} className="glossary-entry">
              <span className="glossary-entry__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.term}</h3>
                <p>{item.definition}</p>
                <p className="glossary-entry__plain"><span>{t.modals.glossaryPlainLabel}</span>{item.inPlainWords}</p>
                {item.caveat && <p className="glossary-entry__caveat">{item.caveat}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
