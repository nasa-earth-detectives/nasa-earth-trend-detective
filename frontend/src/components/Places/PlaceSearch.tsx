import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useI18n } from '../../i18n';
import { usePlaceSearch } from '../../hooks/usePlaceSearch';
import { placeLabel, withExtent, type Place } from '../../services/placeSearch';
import '../../styles/place-search.css';

interface PlaceSearchProps {
  onSelect: (place: Place) => void;
}

const MOVES: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

/**
 * Search box of the header: a city, a department or a country by name. Choosing one opens its outlook
 * (see PlaceForecast): where its trend would take it in the coming years.
 */
export function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const search = usePlaceSearch(query, locale);
  const listed = open && search.ready;
  const count = search.places.length;

  const choose = (place: Place): void => {
    setQuery(placeLabel(place));
    setOpen(false);
    inputRef.current?.blur();
    // A country may still need its extent: the outlook opens when it is known, or when asking gave up.
    setBusy(true);
    void withExtent(place).then(found => {
      setBusy(false);
      onSelect(found);
    });
  };
  const handleKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!listed || count === 0) return;
    const step = MOVES[event.key];
    if (step) {
      event.preventDefault();
      setActive(index => (index + step + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(search.places[Math.min(active, count - 1)]);
    }
  };
  const status = search.loading ? t.places.searching : search.failed ? t.places.unavailable : count === 0 ? t.places.noResults : null;

  return (
    <search id="tour-place-search" className="place-search" data-ui-control data-busy={busy} aria-busy={busy}>
      <Search size={14} strokeWidth={1.8} aria-hidden="true" />
      <input ref={inputRef} type="search" className="place-search__input" value={query} autoComplete="off" spellCheck={false}
        placeholder={t.places.placeholder} aria-label={t.places.searchAria} role="combobox"
        aria-expanded={listed} aria-controls={listId} aria-autocomplete="list"
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={handleKey} />
      {listed && (
        <div className="place-search__panel">
          <div id={listId} role="listbox" aria-label={t.places.resultsAria}>
            {search.places.map((place, index) => (
              // The pointer must not take the focus from the box before the click lands on the option.
              <button key={place.id} type="button" role="option" aria-selected={index === active} className="place-search__option"
                onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(place)}>
                <MapPin size={14} strokeWidth={1.6} aria-hidden="true" />
                <span className="place-search__name">{placeLabel(place)}</span>
                <span className="place-search__kind">{t.places.kinds[place.kind]}{place.country ? ` · ${place.country}` : ''}</span>
              </button>
            ))}
          </div>
          {status && <p className="place-search__status" role="status">{status}</p>}
          <p className="place-search__credit">{t.places.credit}</p>
        </div>
      )}
    </search>
  );
}
