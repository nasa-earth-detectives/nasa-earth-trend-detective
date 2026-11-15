import type { StatusRow } from '../../config/climateLayers';
import { useI18n } from '../../i18n';

interface StatusRowListProps {
  title: string;
  rows: StatusRow[];
}

/** Availability readout; does not simulate future capability controls. */
export function StatusRowList({ title, rows }: StatusRowListProps) {
  const { t } = useI18n();
  return (
    <section className="instrument-status-list" aria-label={title}>
      <ul>
        {rows.map((row) => {
          const localized = t.scientificOverlays[row.id] ?? t.visualSystemRows[row.id];
          return (
            <li key={row.id}>
              <span>{localized?.name ?? row.name}</span>
              <span style={{ color: row.active ? '#93b185' : 'rgba(255,255,255,0.45)', fontWeight: row.active ? 600 : 400 }}>
                {row.active ? (localized?.status ?? row.status) : t.layers.soon}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
