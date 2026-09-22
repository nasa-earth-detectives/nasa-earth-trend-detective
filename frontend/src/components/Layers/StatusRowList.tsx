import type { StatusRow } from '../../config/climateLayers';

interface StatusRowListProps {
  title: string;
  rows: StatusRow[];
}

/** Lectura de disponibilidad; no simula controles de capacidades futuras. */
export function StatusRowList({ title, rows }: StatusRowListProps) {
  return (
    <section className="instrument-status-list" aria-label={title}>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <span>{row.name}</span>
            <span>{row.active ? row.status : 'Pronto'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
