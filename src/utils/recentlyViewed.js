const KEY = 'kino.recentlyViewed';
const LIMIT = 8;

export function getRecentlyViewed() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Keep only what the card needs, newest first, de-duplicated by slug. */
export function addRecentlyViewed(movie) {
  if (!movie?.slug) return;
  const entry = {
    slug: movie.slug,
    title: movie.title,
    posterUrl: movie.posterUrl,
    runtimeMinutes: movie.runtimeMinutes,
    ageRating: movie.ageRating,
    genres: movie.genres,
    isComingSoon: movie.isComingSoon,
  };
  const next = [entry, ...getRecentlyViewed().filter((m) => m.slug !== movie.slug)].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}
