import Icon from './Icon';

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="state-box is-error" role="alert">
      <div className="state-icon">
        <Icon name="alert" size={24} />
      </div>
      <h3>{title}</h3>
      <p>{error?.message || 'We could not load this right now.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'film', title, message, action }) {
  return (
    <div className="state-box">
      <div className="state-icon">
        <Icon name={icon} size={24} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader" role="status">
      <span className="spinner spinner-lg" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
