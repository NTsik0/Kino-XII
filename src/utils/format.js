export const LARI = '₾';

export function money(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return `${LARI}0`;
  const n = Number(value);
  return `${LARI}${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

export function runtime(minutes) {
  if (!minutes) return '';
  return `${minutes} min`;
}

/** Local YYYY-MM-DD (not UTC, so "today" matches the user's calendar). */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** The next `count` days starting today. */
export function nextDays(count = 7) {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    return {
      iso: toISODate(d),
      weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      isToday: i === 0,
    };
  });
}

export function longDate(iso) {
  if (!iso) return '';
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function shortDate(iso) {
  if (!iso) return '';
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function releaseLabel(iso) {
  if (!iso) return '';
  return parseISODate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function genresLabel(movie) {
  return (movie?.genres || []).slice(0, 2).map((g) => g.name).join(', ');
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function countdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
