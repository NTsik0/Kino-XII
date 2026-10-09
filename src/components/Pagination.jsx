import Icon from './Icon';
import './Pagination.css';

/** 1 … 4 5 [6] 7 8 … 20 */
function pageItems(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) items.push('…start');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < last - 1) items.push('…end');
  items.push(last);
  return items;
}

export default function Pagination({ page, lastPage, onChange }) {
  if (!lastPage || lastPage <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      {pageItems(page, lastPage).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className={`page-btn ${item === page ? 'is-current' : ''}`}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="page-gap">
            …
          </span>
        ),
      )}
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= lastPage}
        aria-label="Next page"
      >
        <Icon name="chevronRight" size={16} />
      </button>
      <span className="page-summary">
        Page {page} of {lastPage}
      </span>
    </nav>
  );
}
