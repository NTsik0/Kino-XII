import { useState } from 'react';
import { Link } from 'react-router-dom';
import AgeBadge from '../movie/AgeBadge';
import { Poster } from '../movie/MovieCards';
import Modal from '../Modal';
import Icon from '../Icon';
import { EmptyState, ErrorState } from '../States';
import { useToast } from '../../context/ToastContext';
import { refundOrder } from '../../api/endpoints';
import { money, runtime, shortDate } from '../../utils/format';

function TicketCard({ order, onRefund }) {
  const s = order.session || {};
  const m = s.movie || {};
  const refunded = order.status === 'refunded';
  let refundNote = null;
  if (order.isUpcoming && !order.isRefundable) {
    refundNote = refunded ? 'This order has been refunded.' : 'Refunds close 2 hours before the session starts.';
  }

  return (
    <article className={`ticket-card ${refunded ? 'is-refunded' : ''}`}>
      <Link to={`/movies/${m.slug}`} className="ticket-card-poster" aria-label={m.title}>
        <Poster src={m.posterUrl} alt="" />
      </Link>
      <div className="ticket-card-main">
        <h3 className="ticket-card-title">
          {m.title} <AgeBadge rating={m.ageRating} />
          <span className="ticket-card-runtime">{runtime(m.runtimeMinutes)}</span>
          {refunded && <span className="badge ticket-status">Refunded</span>}
        </h3>
        <dl className="ticket-card-facts">
          <div>
            <dt>Date</dt>
            <dd>
              {shortDate(s.date)} · {s.time}
            </dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>
              {s.venue?.name} · Hall {s.hall?.name}
            </dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>
              {s.format?.name} · {s.language?.name}
            </dd>
          </div>
        </dl>
        <div className="ticket-card-seats">
          <span>Seats</span>
          {order.tickets?.map((t) => (
            <span key={t.id} className="badge">
              {t.seatCode} · {t.ticketType?.name}
            </span>
          ))}
        </div>
      </div>
      <div className="ticket-card-side">
        <div>
          <p className="ticket-card-label">Order</p>
          <p className="ticket-card-ref">{order.reference}</p>
        </div>
        <div>
          <p className="ticket-card-label">Total paid</p>
          <p className="ticket-card-total">{money(order.totalPrice)}</p>
        </div>
        {order.isUpcoming && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-block"
              disabled={!order.isRefundable}
              onClick={() => onRefund(order)}
            >
              Refund
            </button>
            <p className="ticket-card-note">{refundNote || 'Refundable until 2 hours before the show.'}</p>
          </>
        )}
      </div>
    </article>
  );
}

export function TicketSkeleton() {
  return <div className="skeleton" style={{ height: 150, borderRadius: 16, marginBottom: 12 }} aria-hidden="true" />;
}

export default function MyTickets({ request }) {
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [confirming, setConfirming] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);

  const all = request.data || [];
  const upcoming = all.filter((o) => o.isUpcoming);
  const past = all.filter((o) => !o.isUpcoming);
  const list = tab === 'upcoming' ? upcoming : past;

  const doRefund = async () => {
    if (!confirming || refunding) return;
    setRefunding(true);
    setRefundError(null);
    try {
      const updated = await refundOrder(confirming.reference);
      toast.success(`Order ${updated.reference} refunded. Your seats have been released.`);
      setConfirming(null);
      request.reload(); // re-read the lists from the server
    } catch (err) {
      if (!err?.cancelled) setRefundError(err.message);
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="my-tickets">
      <div className="segmented" role="tablist" aria-label="Ticket lists">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={tab === 'upcoming' ? 'is-active' : ''}
          onClick={() => setTab('upcoming')}
        >
          Upcoming {request.data && <span className="segmented-count">{upcoming.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'past'}
          className={tab === 'past' ? 'is-active' : ''}
          onClick={() => setTab('past')}
        >
          Past {request.data && <span className="segmented-count">{past.length}</span>}
        </button>
      </div>

      {request.loading && !request.data ? (
        Array.from({ length: 2 }, (_, i) => <TicketSkeleton key={i} />)
      ) : request.error && !request.data ? (
        <ErrorState error={request.error} onRetry={request.reload} title="Could not load your tickets" />
      ) : list.length === 0 ? (
        tab === 'upcoming' ? (
          <EmptyState
            icon="ticket"
            title="No upcoming tickets"
            message="When you book a session it will show up here."
            action={
              <Link to="/sessions" className="btn btn-primary btn-sm">
                Browse sessions
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon="ticket"
            title="No past tickets"
            message="Sessions you've attended and refunded orders appear here."
          />
        )
      ) : (
        <div className={`ticket-list ${request.loading ? 'is-refreshing' : ''}`}>
          {list.map((o) => (
            <TicketCard key={o.id} order={o} onRefund={(order) => (setRefundError(null), setConfirming(order))} />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(confirming)}
        onClose={() => !refunding && setConfirming(null)}
        title="Refund this order?"
        subtitle={confirming ? `Order ${confirming.reference}` : ''}
        width={420}
      >
        {confirming && (
          <div className="refund-confirm">
            {refundError && (
              <div className="form-alert" role="alert">
                <Icon name="alert" size={16} />
                <span>{refundError}</span>
              </div>
            )}
            <p>
              You&apos;ll get <strong>{money(confirming.totalPrice)}</strong> back for{' '}
              <strong>{confirming.session?.movie?.title}</strong> on {shortDate(confirming.session?.date)} at{' '}
              {confirming.session?.time}. Your seats will be released and this can&apos;t be undone.
            </p>
            <div className="refund-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(null)} disabled={refunding}>
                Keep tickets
              </button>
              <button type="button" className="btn btn-primary" onClick={doRefund} disabled={refunding}>
                {refunding ? (
                  <>
                    <span className="spinner" /> Refunding…
                  </>
                ) : (
                  'Refund order'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
