import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Hero from '../components/home/Hero';
import { ComingSoonCard, MovieCard, MovieCardSkeleton, RecentCard } from '../components/movie/MovieCards';
import { EmptyState, ErrorState } from '../components/States';
import useAsync from '../hooks/useAsync';
import { fetchComingSoon, fetchFeatured, fetchNowPlaying } from '../api/endpoints';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import './HomePage.css';

function Section({ title, action, children }) {
  return (
    <section className="home-section">
      <div className="container">
        <div className="home-section-head">
          <h2 className="section-title">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  const featured = useAsync(() => fetchFeatured(), []);
  const nowPlaying = useAsync(() => fetchNowPlaying(), []);
  const comingSoon = useAsync(() => fetchComingSoon(), []);
  const recent = useMemo(() => getRecentlyViewed(), []);

  const seeAll = (
    <Link to="/sessions" className="link-accent home-see-all">
      See all
    </Link>
  );

  return (
    <div className="home">
      <Hero
        movies={featured.data?.slice(0, 4)}
        loading={featured.loading}
        error={featured.error}
        onRetry={featured.reload}
      />

      {recent.length > 0 && (
        <Section title="Recently viewed">
          <div className="h-scroll">
            {recent.map((m) => (
              <RecentCard key={m.slug} movie={m} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Now playing" action={seeAll}>
        {nowPlaying.error && !nowPlaying.data ? (
          <ErrorState error={nowPlaying.error} onRetry={nowPlaying.reload} title="Could not load films" />
        ) : nowPlaying.loading && !nowPlaying.data ? (
          <div className="h-scroll">
            {Array.from({ length: 7 }, (_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : nowPlaying.data?.length ? (
          <div className="h-scroll">
            {nowPlaying.data.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing is showing right now" message="Check back soon for new releases." />
        )}
      </Section>

      <Section title="Coming soon…">
        {comingSoon.error && !comingSoon.data ? (
          <ErrorState error={comingSoon.error} onRetry={comingSoon.reload} title="Could not load upcoming films" />
        ) : comingSoon.loading && !comingSoon.data ? (
          <div className="h-scroll">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton" style={{ width: 420, height: 162, borderRadius: 16 }} />
            ))}
          </div>
        ) : comingSoon.data?.length ? (
          <div className="h-scroll">
            {comingSoon.data.map((m) => (
              <ComingSoonCard key={m.id} movie={m} />
            ))}
          </div>
        ) : (
          <EmptyState icon="calendar" title="No upcoming releases yet" message="New titles will appear here first." />
        )}
      </Section>
    </div>
  );
}
