import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import { Poster } from '../movie/MovieCards';
import { searchTitles } from '../../api/endpoints';
import { money, runtime } from '../../utils/format';
import './SearchBar.css';

const DEBOUNCE_MS = 300;

/** Header typeahead: prompt, results and no-results states in one dropdown. */
export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ results: [], loading: false, error: null, searched: '' });
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [pathname]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setState({ results: [], loading: false, error: null, searched: '' });
      return undefined;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = setTimeout(() => {
      searchTitles(q, controller.signal)
        .then((results) => {
          setState({ results: results || [], loading: false, error: null, searched: q });
          setActive(-1);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setState({ results: [], loading: false, error, searched: q });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const goTo = (movie) => {
    setOpen(false);
    inputRef.current?.blur();
    navigate(`/movies/${movie.slug}`);
  };

  const browseAll = () => {
    setOpen(false);
    const q = query.trim();
    navigate(q ? `/sessions?search=${encodeURIComponent(q)}` : '/sessions');
  };

  const onKeyDown = (e) => {
    const { results } = state;
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && results[active]) goTo(results[active]);
      else if (results[0]) goTo(results[0]);
      else browseAll();
    }
  };

  const q = query.trim();
  const settled = !state.loading && state.searched === q;

  return (
    <div className={`search ${open ? 'is-open' : ''}`} ref={wrapRef}>
      <div className="search-input">
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search films and live events"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search films and live events"
          aria-expanded={open}
          aria-controls="search-panel"
          role="combobox"
          aria-autocomplete="list"
        />
        {state.loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
        {query && !state.loading && (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <Icon name="close" size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="search-panel" id="search-panel" role="listbox">
          {!q ? (
            <div className="search-empty">
              <div className="search-empty-icon">
                <Icon name="film" size={20} />
              </div>
              <strong>What do you want to watch?</strong>
              <p>Search films and live events by title</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={browseAll}>
                Browse all sessions
              </button>
            </div>
          ) : state.error && settled ? (
            <div className="search-empty">
              <strong>Search is unavailable</strong>
              <p>{state.error.message}</p>
            </div>
          ) : settled && state.results.length === 0 ? (
            <div className="search-empty">
              <div className="search-empty-icon">
                <Icon name="search" size={20} />
              </div>
              <strong>No results for “{q}”</strong>
              <p>Check the spelling or try another film or live event.</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={browseAll}>
                Browse all sessions
              </button>
            </div>
          ) : (
            <>
              <div className="search-head">
                <span>Films &amp; events</span>
                {settled && <span>{state.results.length} results</span>}
              </div>
              {!settled && state.results.length === 0 ? (
                <div className="search-loading">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />
                  ))}
                </div>
              ) : (
                <ul className="search-results">
                  {state.results.map((m, i) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        className={`search-result ${i === active ? 'is-active' : ''}`}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => goTo(m)}
                      >
                        <Poster src={m.posterUrl} alt="" className="search-result-img" />
                        <span className="search-result-text">
                          <strong>{m.title}</strong>
                          <span>
                            {[m.kind === 'event' ? 'Event' : 'Film', m.ageRating?.code, runtime(m.runtimeMinutes)]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                        {m.isComingSoon ? (
                          <span className="search-result-soon">Coming Soon</span>
                        ) : (
                          <span className="search-result-price">from {money(m.fromPrice)}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
