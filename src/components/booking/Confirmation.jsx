import Icon from '../Icon';
import { longDate, money } from '../../utils/format';

/** Rendered from the order the API returned, not from local state. */
export default function Confirmation({ order, onMyTickets, onClose }) {
  const s = order.session;
  return (
    <div className="confirmation">
      <div className="confirmation-icon">
        <Icon name="check" size={30} strokeWidth={3} />
      </div>
      <h3>You&apos;re all set!</h3>
      <p className="confirmation-sub">
        Your tickets are booked for <strong>{order.contact?.fullName}</strong>. You can find them any time in My
        Tickets.
      </p>
      <div className="confirmation-ref">
        <span>Order reference</span>
        <strong>{order.reference}</strong>
      </div>

      <div className="confirmation-card">
        <div className="confirmation-row">
          <span>Film</span>
          <strong>{s?.movie?.title}</strong>
        </div>
        <div className="confirmation-row">
          <span>When</span>
          <strong>
            {longDate(s?.date)} · {s?.time}
          </strong>
        </div>
        <div className="confirmation-row">
          <span>Where</span>
          <strong>
            {s?.venue?.name} · Hall {s?.hall?.name}
          </strong>
        </div>
        <div className="confirmation-row">
          <span>Format</span>
          <strong>
            {s?.format?.name} · {s?.language?.name}
          </strong>
        </div>
        <div className="confirmation-row">
          <span>Seats</span>
          <span className="confirmation-seats">
            {order.tickets?.map((t) => (
              <span key={t.id} className="badge">
                {t.seatCode} · {t.ticketType?.name} · {money(t.price)}
              </span>
            ))}
          </span>
        </div>
        <div className="confirmation-row is-total">
          <span>Paid{order.cardLastFour ? ` with card •••• ${order.cardLastFour}` : ''}</span>
          <strong>{money(order.totalPrice)}</strong>
        </div>
      </div>

      <div className="confirmation-actions">
        <button type="button" className="btn btn-primary" onClick={onMyTickets}>
          <Icon name="ticket" size={16} /> My Tickets
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
