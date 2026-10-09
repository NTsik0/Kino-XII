import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { nextDays, todayISO } from '../utils/format';

/*
 * The sessions page keeps its whole state in the query string:
 *   /sessions?venue=galleria,batumi&date=2026-11-14&format=max&language=georgian-dub
 *            &time=evening&search=dune&sort=price_asc&page=2
 * so a copied link, a refresh and Back/Forward all restore the exact view.
 */

const LIST_KEYS = ['venue', 'format', 'language', 'time'];
export const DEFAULT_SORT = 'time_asc';

function readList(params, key) {
  const raw = params.get(key);
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
}

export default function useSessionFilters() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const filters = useMemo(() => {
    const window7 = nextDays(7).map((d) => d.iso);
    const date = params.get('date');
    const page = Number.parseInt(params.get('page') || '1', 10);
    return {
      venue: readList(params, 'venue'),
      format: readList(params, 'format'),
      language: readList(params, 'language'),
      time: readList(params, 'time'),
      // Dates outside the 7 day window fall back to today.
      date: date && window7.includes(date) ? date : todayISO(),
      search: params.get('search') || '',
      sort: params.get('sort') || DEFAULT_SORT,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    };
  }, [params]);

  /**
   * Apply a patch. Any change other than the page itself sends the user
   * back to page 1, so adding a filter on page 4 never shows an empty page.
   */
  const update = useCallback(
    (patch, { replace = false } = {}) => {
      const next = new URLSearchParams(location.search);
      Object.entries(patch).forEach(([key, value]) => {
        const empty =
          value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
        if (empty) next.delete(key);
        else next.set(key, Array.isArray(value) ? value.join(',') : String(value));
      });
      if (!('page' in patch)) next.delete('page');
      if (next.get('page') === '1') next.delete('page');
      if (next.get('sort') === DEFAULT_SORT) next.delete('sort');
      // Keep commas readable: ?venue=galleria,batumi rather than galleria%2Cbatumi.
      const search = next.toString().replace(/%2C/gi, ',');
      if (`?${search}` === location.search || (!search && !location.search)) return;
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace });
    },
    [location.pathname, location.search, navigate],
  );

  const toggle = useCallback(
    (key, value, extra = () => ({})) => {
      const current = filters[key];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      update({ [key]: next, ...extra(next) });
    },
    [filters, update],
  );

  const activeCount = LIST_KEYS.reduce((n, k) => n + filters[k].length, 0) + (filters.search ? 1 : 0);

  const clearAll = useCallback(() => {
    // Everything except the date.
    update({ venue: [], format: [], language: [], time: [], search: '' });
  }, [update]);

  return { filters, update, toggle, clearAll, activeCount };
}

/** Map the URL state onto the API's query parameters. */
export function toApiQuery(filters) {
  return {
    date: filters.date,
    venues: filters.venue,
    formats: filters.format,
    languages: filters.language,
    bands: filters.time,
    search: filters.search || undefined,
    sort: filters.sort,
    page: filters.page,
  };
}
