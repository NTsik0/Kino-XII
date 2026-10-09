import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AgeBadge from '../components/movie/AgeBadge';
import { NotifyButton, Poster } from '../components/movie/MovieCards';
import DatePicker from '../components/session/DatePicker';
import SessionTile, { SessionTileSkeleton } from '../components/session/SessionTile';
import Icon from '../components/Icon';
import { EmptyState, ErrorState, PageLoader } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import useAsync from '../hooks/useAsync';
import { fetchMovie, fetchMovieSessions } from '../api/endpoints';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import { ageBlockReason } from '../utils/eligibility';
import { comingSoonLabel, longDate, money, nextDays, releaseLabel, todayISO } from '../utils/format';
import './MoviePage.css';

/** Group a venue's sessions by hall, keeping start-time order. */
function byHall(sessions) {
  const map = new Map();
  sessions.forEach((s) => {
    const key = s.hall?.name ?? '?';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function MoviePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { openBooking } = useBooking();
  const movieReq = useAsync(() => fetchMovie(slug), [slug]);
  const movie = movieReq.data;

  // Default to the first day in the 7-day window that actually has sessions.
  const window7 = useMemo(() => nextDays(7).map((d) => d.iso), []);
  const [date, setDate] = useState(todayISO());
  useEffect(() => {
    if (!movie) return;
    addRecentlyViewed(movie);
    const firstAvailable = window7.find((d) => movie.availableDates?.includes(d));
    setDate(firstAvailable || todayISO());
  }, [movie, window7]);

  const sessionsReq = useAsync(
    (signal) => (movie && !movie.isComingSoon ? fetchMovieSessions(slug, date, signal) : Promise.resolve([])),
    [slug, date, movie?.id],
  );

  if (movieReq.loading && !movie) return <PageLoader />;
  if (movieReq.error && !movie) {
    return (
      <div className="container" style={{ paddingTop: 140 }}>
        {movieReq.error.status === 404 ? (
          <EmptyState
            title="Film not found"
            message="This title may have been removed from the programme."
            action={
              <Link to="/sessions" className="btn btn-ghost btn-sm">
                Browse all sessions
              </Link>
            }
          />
        ) : (
          <ErrorState error={movieReq.error} onRetry={movieReq.reload} />
        )}
      </div>
    );
  }
  if (!movie) return null;

  const blocked = ageBlockReason(user, movie);
  const venues = sessionsReq.data || [];

  return (
    <div className="movie-page">
      <section className="movie-hero">
        <div
          className="movie-hero-bg"
          style={{ backgroundImage: movie.backdropUrl ? `url(${movie.backdropUrl})` : undefined }}
          aria-hidden="true"
        />
        <div className="container movie-hero-inner">
          <div className="movie-hero-poster">
            <Poster src={movie.posterUrl} alt={`${movie.title} poster`} />
          </div>
          <div className="movie-hero-text">
            <p className="movie-hero-kicker">{movie.isComingSoon ? comingSoonLabel(movie.releaseDate, 'Opens') : 'Now showing'}</p>
            <h1>{movie.title}</h1>
            {movie.synopsis && <p className="movie-hero-synopsis">{movie.synopsis}</p>}
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
          </div>
        </div>
      </section>

      <div className="container movie-body">
        <section className="movie-sessions">
          <h2 className="movie-block-title">Sessions</h2>

          {movie.isComingSoon ? (
            <EmptyState
              icon="calendar"
              title="Not on sale yet"
              message={`${movie.title} is not on sale yet. Sessions will appear here once tickets go on sale.`}
              action={<NotifyButton movie={movie} className="btn btn-primary btn-sm" />}
            />
          ) : (
            <>
              <p className="movie-sessions-sub">Pick a day and a showtime to choose your seats.</p>
              <DatePicker value={date} onChange={setDate} available={movie.availableDates} />

              {blocked && (
                <div className="age-notice" role="note">
                  <Icon name="alert" size={18} />
                  <span>{blocked}</span>
                </div>
              )}

              <div className="movie-sessions-list" aria-busy={sessionsReq.loading}>
                {sessionsReq.loading ? (
                  <div className="venue-group">
                    <div className="skeleton" style={{ width: 180, height: 18, marginBottom: 16 }} />
                    <div className="hall-grid">
                      {Array.from({ length: 4 }, (_, i) => (
                        <SessionTileSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                ) : sessionsReq.error ? (
                  <ErrorState error={sessionsReq.error} onRetry={sessionsReq.reload} title="Could not load sessions" />
                ) : venues.length === 0 ? (
                  <EmptyState
                    icon="calendar"
                    title="No sessions on this date"
                    message={`There are no showings of ${movie.title} on ${longDate(date)}. Try another day.`}
                  />
                ) : (
                  venues.map(({ venue, sessions }) => (
                    <div key={venue.id} className="venue-group">
                      <h3 className="venue-name">
                        {venue.name} <span>{venue.city}</span>
                      </h3>
                      <div className="hall-list">
                        {byHall(sessions).map(([hall, list]) => (
                          <div key={hall} className="hall-block">
                            <p className="hall-name">Hall {hall}</p>
                            <div className="hall-grid">
                              {list.map((s) => (
                                <SessionTile
                                  key={s.id}
                                  session={s}
                                  blockedReason={blocked}
                                  onSelect={() => openBooking({ ...s, movie: s.movie || movie })}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <aside className="movie-details">
          <h2 className="movie-block-title">Details</h2>
          <dl>
            {movie.director && (
              <>
                <dt>Director</dt>
                <dd>{movie.director}</dd>
              </>
            )}
            {movie.cast && (
              <>
                <dt>Main cast</dt>
                <dd>{movie.cast}</dd>
              </>
            )}
            <dt>Genre</dt>
            <dd>{movie.genres?.map((g) => g.name).join(', ') || '—'}</dd>
            <dt>Duration</dt>
            <dd>{movie.runtimeMinutes} minutes</dd>
            <dt>Release date</dt>
            <dd>{releaseLabel(movie.releaseDate)}</dd>
            <dt>Formats</dt>
            <dd>{movie.formats?.map((f) => f.name).join(', ') || '—'}</dd>
            {!movie.isComingSoon && (
              <>
                <dt>From</dt>
                <dd>{money(movie.fromPrice)}</dd>
              </>
            )}
          </dl>
          {movie.ageRating && (
            <div className="rating-note">
              <p className="rating-note-title">Rating note</p>
              <p>
                <strong>{movie.ageRating.code}</strong> — {movie.ageRating.description}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
