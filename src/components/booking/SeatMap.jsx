import { Fragment } from 'react';

const STATE_LABEL = {
  available: 'available',
  sold: 'sold',
  held: 'held by another user',
};

/**
 * Draws the hall exactly as the API returns it: sections → rows → seats.
 * Nothing about the layout is hardcoded; row labels, widths, gaps and
 * gangways (aisleAfter) all come from the response.
 */
export default function SeatMap({ seatMap, selectedIds, onToggle, disabled }) {
  return (
    <div className="seat-map">
      <div className="screen" aria-hidden="true">
        Screen
      </div>

      {seatMap.sections.map((section) => {
        const labels = section.rows.map((r) => r.label);
        const range = labels.length > 1 ? `Rows ${labels[0]}–${labels[labels.length - 1]}` : `Row ${labels[0] ?? ''}`;
        return (
          <section key={section.name} className="seat-section" aria-label={section.name}>
            <p className="seat-section-name">
              {section.name} · {range}
            </p>
            <div className="seat-rows">
              {section.rows.map((row) => (
                <div key={row.label} className="seat-row">
                  <span className="seat-row-label">{row.label}</span>
                  <div className="seat-row-seats">
                    {row.seats.map((seat) => {
                      let node;
                      if (seat.state === 'unavailable') {
                        // A real gap in the plan: keep the space, draw no button.
                        node = <span className="seat seat-gap" aria-hidden="true" />;
                      } else {
                        const selected = selectedIds.has(seat.id);
                        const state = selected ? 'selected' : seat.isMine ? 'available' : seat.state;
                        const clickable = state === 'available' || state === 'selected';
                        node = (
                          <button
                            type="button"
                            className={`seat is-${state}`}
                            disabled={!clickable || disabled}
                            onClick={() => onToggle(seat, section)}
                            aria-pressed={selected}
                            aria-label={`Seat ${seat.code}, ${selected ? 'selected' : STATE_LABEL[state] || state}`}
                            title={`${seat.code}${clickable ? '' : ` · ${STATE_LABEL[state] || state}`}`}
                          >
                            {seat.label}
                          </button>
                        );
                      }
                      return (
                        <Fragment key={seat.id}>
                          {node}
                          {seat.aisleAfter && <span className="seat-aisle" aria-hidden="true" />}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <ul className="seat-legend">
        <li>
          <span className="seat-swatch is-available" /> Available
        </li>
        <li>
          <span className="seat-swatch is-selected" /> Selected
        </li>
        <li>
          <span className="seat-swatch is-sold" /> Sold
        </li>
        <li>
          <span className="seat-swatch is-held" /> Held by another user
        </li>
      </ul>
    </div>
  );
}

export function SeatMapSkeleton() {
  return (
    <div className="seat-map" aria-busy="true">
      <div className="skeleton" style={{ height: 26, borderRadius: 8, marginBottom: 28 }} />
      {Array.from({ length: 6 }, (_, r) => (
        <div key={r} className="seat-row">
          <span className="seat-row-label" />
          <div className="seat-row-seats">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="seat skeleton" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
