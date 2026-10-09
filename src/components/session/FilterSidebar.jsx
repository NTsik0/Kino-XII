import { useMemo } from 'react';
import DatePicker from './DatePicker';
import { useFilterOptions } from '../../context/FilterOptionsContext';
import './FilterSidebar.css';

function CheckRow({ checked, onChange, label, hint }) {
  return (
    <label className={`check-row ${checked ? 'is-checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="check-box" aria-hidden="true" />
      <span className="check-label">{label}</span>
      {hint && <span className="check-hint">{hint}</span>}
    </label>
  );
}

function Group({ title, children }) {
  return (
    <fieldset className="filter-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

/** Formats the selected venues can actually show; every format when none are selected. */
export function allowedFormats(venues, formats, selectedVenues) {
  if (!selectedVenues.length) return formats;
  const slugs = new Set(
    venues.filter((v) => selectedVenues.includes(v.slug)).flatMap((v) => (v.formats || []).map((f) => f.slug)),
  );
  return formats.filter((f) => slugs.has(f.slug));
}

export default function FilterSidebar({ filters, update, toggle, clearAll, activeCount }) {
  const { venues, formats, languages, timeBands, loading, error, reload } = useFilterOptions();

  const visibleFormats = useMemo(() => allowedFormats(venues, formats, filters.venue), [venues, formats, filters.venue]);

  const toggleVenue = (slug) =>
    toggle('venue', slug, (nextVenues) => {
      // Drop selected formats the new venue selection cannot show.
      const allowed = new Set(allowedFormats(venues, formats, nextVenues).map((f) => f.slug));
      const kept = filters.format.filter((f) => allowed.has(f));
      return kept.length !== filters.format.length ? { format: kept } : {};
    });

  if (error) {
    return (
      <aside className="filters">
        <p className="filters-error">Could not load filters.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          Try again
        </button>
      </aside>
    );
  }

  return (
    <aside className="filters" aria-label="Filters">
      <h2 className="filters-title">Filters</h2>

      <Group title="Venue">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" style={{ height: 18, margin: '8px 0' }} />)
          : venues.map((v) => (
              <CheckRow
                key={v.slug}
                checked={filters.venue.includes(v.slug)}
                onChange={() => toggleVenue(v.slug)}
                label={v.name}
                hint={v.city}
              />
            ))}
      </Group>

      <Group title="Date">
        <DatePicker compact value={filters.date} onChange={(date) => update({ date })} />
      </Group>

      <Group title="Format">
        {visibleFormats.map((f) => (
          <CheckRow
            key={f.slug}
            checked={filters.format.includes(f.slug)}
            onChange={() => toggle('format', f.slug)}
            label={f.name}
          />
        ))}
      </Group>

      <Group title="Language">
        {languages.map((l) => (
          <CheckRow
            key={l.slug}
            checked={filters.language.includes(l.slug)}
            onChange={() => toggle('language', l.slug)}
            label={l.name}
          />
        ))}
      </Group>

      <Group title="Time of day">
        {timeBands.map((b) => {
          const match = /^(.*?)\s*\((.*)\)$/.exec(b.label);
          return (
            <CheckRow
              key={b.id}
              checked={filters.time.includes(b.id)}
              onChange={() => toggle('time', b.id)}
              label={match ? match[1] : b.label}
              hint={match ? match[2] : null}
            />
          );
        })}
      </Group>

      <div className="filters-foot">
        <button type="button" className="btn btn-outline btn-sm btn-block" onClick={clearAll} disabled={!activeCount}>
          Clear All Filters
        </button>
        <p className="filters-count" aria-live="polite">
          {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
        </p>
      </div>
    </aside>
  );
}
