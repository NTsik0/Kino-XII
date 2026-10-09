import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AgeBadge from '../movie/AgeBadge';
import Icon from '../Icon';
import { ErrorState } from '../States';
import { genresLabel } from '../../utils/format';
import './Hero.css';

const SLIDE_MS = 7000;

export default function Hero({ movies, loading, error, onRetry }) {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const count = movies?.length || 0;

  const go = useCallback((next) => setIndex(() => (count ? (next + count) % count : 0)), [count]);

  // Auto-advance; restarting the timer on every change keeps the progress bar in sync.
  useEffect(() => {
    if (count < 2) return undefined;
    timer.current = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [index, count, go]);

  if (loading && !count) {
    return (
      <section className="hero is-loading" aria-busy="true">
        <div className="container hero-content">
          <div className="skeleton" style={{ width: 180, height: 22 }} />
          <div className="skeleton" style={{ width: 520, height: 56, marginTop: 18 }} />
          <div className="skeleton" style={{ width: 460, height: 64, marginTop: 18 }} />
        </div>
      </section>
    );
  }

  if (error && !count) {
    return (
      <section className="hero is-error">
        <div className="container hero-content">
          <ErrorState error={error} onRetry={onRetry} title="Could not load featured films" />
        </div>
      </section>
    );
  }

  if (!count) return null;
  const movie = movies[index];

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured films"
    >
      {movies.map((m, i) => (
        <div
          key={m.id}
          className={`hero-bg ${i === index ? 'is-active' : ''}`}
          style={{ backgroundImage: m.backdropUrl ? `url(${m.backdropUrl})` : undefined }}
          aria-hidden="true"
        />
      ))}
      <div className="hero-shade" aria-hidden="true" />

      <div className="container hero-content" key={movie.id}>
        <p className="hero-kicker">Now showing · {genresLabel(movie) || 'Film'}</p>
        <h1 className="hero-title">{movie.title}</h1>
        <div className="hero-badges">
          <AgeBadge rating={movie.ageRating} />
          <span className="badge">
            <Icon name="clock" size={12} /> {movie.runtimeMinutes} Min
          </span>
          {movie.formats?.map((f) => (
            <span key={f.id} className="badge">
              {f.name}
            </span>
          ))}
        </div>
        {movie.synopsis && <p className="hero-synopsis">{movie.synopsis}</p>}
        <div className="hero-actions">
          <Link to={`/movies/${movie.slug}`} className="btn btn-primary">
            <Icon name="ticket" size={16} /> Buy tickets
          </Link>
          <Link to="/sessions" className="btn btn-ghost">
            All sessions
          </Link>
        </div>
      </div>

      {count > 1 && (
        <div className="container hero-controls">
          <div className="hero-progress">
            {movies.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={`hero-progress-bar ${i === index ? 'is-active' : ''} ${i < index ? 'is-done' : ''}`}
                onClick={() => go(i)}
                aria-label={`Show ${m.title}`}
                aria-current={i === index}
              >
                <span style={{ '--slide-ms': `${SLIDE_MS}ms` }} />
              </button>
            ))}
          </div>
          <div className="hero-arrows">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous film">
              <Icon name="chevronLeft" size={18} />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next film">
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
