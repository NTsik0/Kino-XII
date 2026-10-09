/** Message shown when a signed-in user is too young for a title, or null. */
export function ageBlockReason(user, movie) {
  const minAge = movie?.ageRating?.minAge ?? 0;
  if (!user || user.age === null || user.age === undefined || !minAge) return null;
  if (user.age >= minAge) return null;
  return `This film is rated ${movie.ageRating.code}. You cannot buy tickets for it with this account.`;
}
