/** Age rating badge. The API's description doubles as tooltip copy. */
export default function AgeBadge({ rating, className = '' }) {
  if (!rating) return null;
  return (
    <span className={`badge badge-age tooltip-host ${className}`} data-tip={rating.description || undefined}>
      {rating.code}
    </span>
  );
}
