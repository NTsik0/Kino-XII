import Icon from '../Icon';
import { money } from '../../utils/format';

/** Right-hand panel of step 1: chosen seats, ticket type per seat, live subtotal. */
export default function SelectionPanel({
  selection,
  ticketTypes,
  isTypeBlocked,
  priceFor,
  violations,
  maxSeats,
  subtotal,
  onChangeType,
  onRemove,
  onNext,
  canContinue,
  blockReason,
  busy,
}) {
  return (
    <aside className="selection-panel">
      <div>
        <h3 className="selection-title">Your seats · Max {maxSeats}</h3>
        <p className="selection-hint">
          Pick up to {maxSeats} seats from the map. Each seat can carry its own ticket type.
        </p>
      </div>

      <div className="selection-list">
        {selection.length === 0 ? (
          <div className="selection-empty">
            <Icon name="seat" size={22} />
            <span>No seats selected yet</span>
          </div>
        ) : (
          selection.map((item) => {
            const violation = violations[item.seatId];
            return (
              <div key={item.seatId} className={`selection-item ${violation ? 'is-invalid' : ''}`}>
                <div className="selection-item-head">
                  <span>
                    Seat <strong>{item.code}</strong>
                    <small> · {item.sectionName}</small>
                  </span>
                  <span className="selection-item-price">{money(priceFor(item.ticketType))}</span>
                  <button type="button" onClick={() => onRemove(item.seatId)} aria-label={`Remove seat ${item.code}`}>
                    <Icon name="close" size={14} />
                  </button>
                </div>
                <div className="ticket-pills" role="radiogroup" aria-label={`Ticket type for ${item.code}`}>
                  {ticketTypes.map((t) => {
                    const blocked = isTypeBlocked(t);
                    return (
                      <button
                        key={t.slug}
                        type="button"
                        role="radio"
                        aria-checked={item.ticketType === t.slug}
                        className={`ticket-pill ${item.ticketType === t.slug ? 'is-active' : ''} ${t.note ? 'tooltip-host' : ''}`}
                        data-tip={blocked ? t.note || 'Not available for this film' : t.note || undefined}
                        disabled={blocked}
                        onClick={() => onChangeType(item.seatId, t.slug)}
                      >
                        {t.name} {Math.round(t.priceRatio * 100)}%
                      </button>
                    );
                  })}
                </div>
                {violation && (
                  <p className="selection-violation">
                    <Icon name="alert" size={13} /> {item.code}: {violation}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="selection-foot">
        {selection.length > 0 && (
          <ul className="price-lines">
            {selection.map((item) => (
              <li key={item.seatId}>
                <span>
                  {item.code} · {item.sectionName} · {ticketTypes.find((t) => t.slug === item.ticketType)?.name}
                </span>
                <span>{money(priceFor(item.ticketType))}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="subtotal">
          <span>Subtotal</span>
          <strong>{money(subtotal)}</strong>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={onNext} disabled={!canContinue || busy}>
          {busy ? (
            <>
              <span className="spinner" /> Holding seats…
            </>
          ) : (
            'Next: Checkout'
          )}
        </button>
        {blockReason && <p className="selection-block-reason">{blockReason}</p>}
      </div>
    </aside>
  );
}
