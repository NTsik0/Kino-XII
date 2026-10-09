import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FilterSidebar from '../components/session/FilterSidebar';
import SessionTile, { SessionTileSkeleton } from '../components/session/SessionTile';
import AgeBadge from '../components/movie/AgeBadge';
import { Poster } from '../components/movie/MovieCards';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { EmptyState, ErrorState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useFilterOptions } from '../context/FilterOptionsContext';
import useAsync from '../hooks/useAsync';
import useSessionFilters, { toApiQuery } from '../hooks/useSessionFilters';
import { fetchSessions } from '../api/endpoints';
import { ageBlockReason } from '../utils/eligibility';
import { longDate, pluralize, runtime } from '../utils/format';
import './SessionsPage.css';

function GroupSkeleton() {
  return (
    <div className="session-group" aria-hidden="true">
      <div className="session-group-head">
        <div className="skeleton" style={{ width: 56, height: 80, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: 220, height: 18 }} />
          <div className="skeleton" style={{ width: 120, height: 12, marginTop: 10 }} />
        </div>
      </div>
      <div className="session-group-grid">
        {Array.from({ length: 5 }, (_, i) => (
          <SessionTileSkeleton key={i} showVenue />
        ))}
      </div>
    </div>
  );
}

function SearchInput({ value, onCommit }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return undefined;
    const t = setTimeout(() => onCommit(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text, value, onCommit]);

  return (
    <label className="sessions-search">
      <Icon name="search" size={15} />
      <input
        type="search"
        placeholder="Search by title"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Search sessions by film title"
        maxLength={100}
      />
      {text && (
        <button type="button" onClick={() => setText('')} aria-label="Clear search">
          <Icon name="close" size={12} />
        </button>
      )}
    </label>
  );
}

export default function SessionsPage() {
  const { filters, update, toggle, clearAll, activeCount } = useSessionFilters();
  const { sorts } = useFilterOptions();
  const { user } = useAuth();
  const { openBooking } = useBooking();
  const queryKey = JSON.stringify(filters);

  const req = useAsync((signal) => fetchSessions(toApiQuery(filters), signal), [queryKey]);
  const groups = req.data?.data || [];
  const meta = req.data?.meta;

  // If the URL points past the last page (e.g. an old link), snap back.
  useEffect(() => {
    if (meta && meta.lastPage >= 1 && filters.page > meta.lastPage) update({ page: meta.lastPage }, { replace: true });
  }, [meta, filters.page, update]);

  const changePage = (page) => {
    update({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const commitSearch = (search) => update({ search });

  let counter = 'Loading sessions…';
  if (!req.loading && meta) counter = meta.totalSessions ? `Showing ${pluralize(meta.totalSessions, 'session')}` : 'No sessions found';
  if (!req.loading && req.error) counter = '';

  return (
    <div className="container sessions-page">
      <header className="page-head">
        <h1>Sessions</h1>
        <p>Browse showtimes across all venues · {longDate(filters.date)}</p>
      </header>

      <div className="sessions-layout">
        <FilterSidebar filters={filters} update={update} toggle={toggle} clearAll={clearAll} activeCount={activeCount} />

        <section className="sessions-list" aria-busy={req.loading}>
          <div className="sessions-toolbar">
            <p className="sessions-counter" aria-live="polite">
              {counter}
            </p>
            <div className="sessions-toolbar-right">
              <SearchInput value={filters.search} onCommit={commitSearch} />
              <label className="sort-select">
                <span>Sort:</span>
                <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort sessions">
                  {sorts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={14} />
              </label>
            </div>
          </div>

          {req.loading ? (
            Array.from({ length: 3 }, (_, i) => <GroupSkeleton key={i} />)
          ) : req.error ? (
            <ErrorState error={req.error} onRetry={req.reload} title="Could not load sessions" />
          ) : groups.length === 0 ? (
            <EmptyState
              icon="search"
              title="No sessions found"
              message={
                activeCount
                  ? 'Nothing matches these filters on this date. Try removing a filter or picking another day.'
                  : 'There are no sessions on this date. Try another day.'
              }
              action={
                activeCount ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
                    Clear all filters
                  </button>
                ) : null
              }
            />
          ) : (
            groups.map(({ movie, sessions }) => {
              const blocked = ageBlockReason(user, movie);
              return (
                <article key={movie.id} className="session-group">
                  <div className="session-group-head">
                    <Link to={`/movies/${movie.slug}`} className="session-group-poster" aria-label={movie.title}>
                      <Poster src={movie.posterUrl} alt="" />
                    </Link>
                    <div>
                      <h2 className="session-group-title">
                        <Link to={`/movies/${movie.slug}`}>{movie.title}</Link>
                        <AgeBadge rating={movie.ageRating} />
                      </h2>
                      <p className="session-group-meta">
                        {runtime(movie.runtimeMinutes)} · {pluralize(sessions.length, 'session')}
                      </p>
                      {blocked && <p className="session-group-blocked">{blocked}</p>}
                    </div>
                  </div>
                  <div className="session-group-grid">
                    {sessions.map((s) => (
                      <SessionTile
                        key={s.id}
                        session={s}
                        showVenue
                        blockedReason={blocked}
                        onSelect={() => openBooking({ ...s, movie: s.movie || movie })}
                      />
                    ))}
                  </div>
                </article>
              );
            })
          )}

          {!req.loading && !req.error && meta && (
            <Pagination page={meta.currentPage || filters.page} lastPage={meta.lastPage} onChange={changePage} />
          )}
        </section>
      </div>
    </div>
  );
}
