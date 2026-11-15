import { useId } from 'react';
import { useI18n } from '../../i18n';

interface InstrumentSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

/** Native button: Space and Enter keys retain accessible behavior. */
export function InstrumentSwitch({ label, description, checked, disabled = false, onChange }: InstrumentSwitchProps) {
  const { t } = useI18n();
  const id = useId();
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      aria-labelledby={id + '-label'} aria-describedby={description ? id + '-description' : undefined}
      onClick={() => onChange(!checked)} className="instrument-switch focus-ring">
      <span className="instrument-switch__copy">
        <span id={id + '-label'} className="instrument-switch__label">{label}</span>
        {description && <span id={id + '-description'} className="instrument-switch__description">{description}</span>}
      </span>
      <span className="instrument-switch__state" aria-hidden="true">{checked ? t.layers.switchOn : t.layers.switchOff}</span>
      <span className="instrument-switch__track" aria-hidden="true"><span /></span>
    </button>
  );
}
