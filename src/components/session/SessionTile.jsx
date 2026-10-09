import Icon from '../Icon';
import { money } from '../../utils/format';
import './SessionTile.css';

/**
 * One showtime. Sold out and age-restricted sessions stay visible but are
 * disabled, so the time remains readable.
 */
export default function SessionTile({ session, onSelect, blockedReason, showVenue = false }) {
  const disabled = session.isSoldOut || Boolean(blockedReason);
  const lowSeats = !session.isSoldOut && session.seatsLeft <= 15;

  return (
    <button
      type="button"
      className={`session-tile ${session.isSoldOut ? 'is-sold-out' : ''} ${blockedReason ? 'is-blocked' : ''}`}
      onClick={() => !disabled && onSelect?.(session)}
      disabled={disabled}
      title={blockedReason || (session.isSoldOut ? 'Sold out' : undefined)}
      aria-label={`${session.time}, ${session.venue?.name} hall ${session.hall?.name}, ${session.format?.name}, ${
        session.language?.name
      }, from ${money(session.price)}${session.isSoldOut ? ', sold out' : `, ${session.seatsLeft} seats left`}`}
    >
      <span className="session-tile-main">
        <span className="session-tile-time">{session.time}</span>
        <span className="session-tile-tags">
          <span className="tooltip-host session-tile-lang" data-tip={session.language?.name}>
            {session.language?.code}
          </span>
          <span className="badge badge-format">{session.format?.name}</span>
        </span>
      </span>
      <span className="session-tile-side">
        <span className="session-tile-price">
          <small>from</small> {money(session.price)}
        </span>
        <span className={`session-tile-seats ${lowSeats ? 'is-low' : ''}`}>
          {session.isSoldOut ? (
            'Sold out'
          ) : (
            <>
              <Icon name="seat" size={12} /> {session.seatsLeft} left
            </>
          )}
        </span>
      </span>
      {showVenue && (
        <span className="session-tile-venue">
          {session.venue?.name} · Hall {session.hall?.name}
        </span>
      )}
    </button>
  );
}

export function SessionTileSkeleton({ showVenue }) {
  return <div className="skeleton session-tile-skeleton" style={{ height: showVenue ? 96 : 72 }} aria-hidden="true" />;
}
