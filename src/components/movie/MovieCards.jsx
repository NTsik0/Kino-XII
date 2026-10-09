import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AgeBadge from './AgeBadge';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { notifyMe } from '../../api/endpoints';
import { comingSoonLabel, genresLabel, money, runtime } from '../../utils/format';
import './MovieCards.css';

function Poster({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`poster-fallback ${className}`}>
        <Icon name="film" size={28} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

export { Poster };

export function MovieCard({ movie }) {
  const navigate = useNavigate();
  const to = `/movies/${movie.slug}`;
  return (
    <article className="movie-card">
      <Link to={to} className="movie-card-poster" aria-label={movie.title}>
        <Poster src={movie.posterUrl} alt="" />
      </Link>
      <div className="movie-card-body">
        <Link to={to} className="movie-card-title" title={movie.title}>
          {movie.title}
        </Link>
        <p className="movie-card-meta">
          {[genresLabel(movie), runtime(movie.runtimeMinutes)].filter(Boolean).join(' · ')}
        </p>
        <AgeBadge rating={movie.ageRating} />
        <div className="movie-card-foot">
          <span className="movie-card-price">
            From <strong>{money(movie.fromPrice)}</strong>
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(to)}>
            Buy Ticket
          </button>
        </div>
      </div>
    </article>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="movie-card is-skeleton" aria-hidden="true">
      <div className="skeleton movie-card-poster" />
      <div className="movie-card-body">
        <div className="skeleton" style={{ height: 16, width: '80%' }} />
        <div className="skeleton" style={{ height: 12, width: '55%', marginTop: 8 }} />
        <div className="skeleton" style={{ height: 32, marginTop: 18 }} />
      </div>
    </div>
  );
}

export function NotifyButton({ movie, className = 'btn btn-outline btn-sm' }) {
  const { requireAuth } = useAuth();
  const toast = useToast();
  const [subscribed, setSubscribed] = useState(Boolean(movie.isNotified));
  const [busy, setBusy] = useState(false);

  const click = () =>
    requireAuth(async () => {
      if (busy) return;
      setBusy(true);
      try {
        const res = await notifyMe(movie.slug);
        setSubscribed(res?.subscribed ?? true);
        toast.success(`We'll let you know when ${movie.title} opens.`);
      } catch (err) {
        if (!err?.cancelled) toast.error(err.message);
      } finally {
        setBusy(false);
      }
    });

  return (
    <button type="button" className={`${className} notify-btn ${subscribed ? 'is-on' : ''}`} onClick={click} disabled={busy}>
      {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Icon name={subscribed ? 'check' : 'bell'} size={14} />}
      {subscribed ? 'Notified' : 'Notify Me'}
    </button>
  );
}

export function ComingSoonCard({ movie }) {
  const to = `/movies/${movie.slug}`;
  return (
    <article className="soon-card">
      <Link to={to} className="soon-card-media" aria-label={movie.title}>
        <Poster src={movie.backdropUrl || movie.posterUrl} alt="" />
      </Link>
      <div className="soon-card-body">
        <p className="soon-card-date">{comingSoonLabel(movie.releaseDate)}</p>
        <Link to={to} className="soon-card-title">
          {movie.title}
        </Link>
        <p className="movie-card-meta">
          {[genresLabel(movie), runtime(movie.runtimeMinutes)].filter(Boolean).join(' · ')}
        </p>
        <AgeBadge rating={movie.ageRating} />
        <div style={{ marginTop: 'auto' }}>
          <NotifyButton movie={movie} />
        </div>
      </div>
    </article>
  );
}

export function RecentCard({ movie }) {
  return (
    <Link to={`/movies/${movie.slug}`} className="recent-card">
      <Poster src={movie.posterUrl} alt="" className="recent-card-img" />
      <div>
        <p className="recent-card-title">{movie.title}</p>
        <p className="movie-card-meta">
          {[movie.genres?.[0]?.name, runtime(movie.runtimeMinutes)].filter(Boolean).join(' · ')}
        </p>
        <AgeBadge rating={movie.ageRating} />
      </div>
    </Link>
  );
}
