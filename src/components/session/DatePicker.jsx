import { nextDays } from '../../utils/format';
import './DatePicker.css';

/** Horizontal picker over the next 7 days. One date at a time. */
export default function DatePicker({ value, onChange, available, compact = false }) {
  const days = nextDays(7);
  const availableSet = available ? new Set(available) : null;

  return (
    <div className={`date-picker ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label="Date">
      {days.map((d) => {
        const disabled = availableSet ? !availableSet.has(d.iso) : false;
        const selected = d.iso === value;
        return (
          <button
            key={d.iso}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`date-chip ${selected ? 'is-selected' : ''}`}
            disabled={disabled}
            onClick={() => onChange(d.iso)}
            title={disabled ? 'No sessions on this day' : `${d.weekday} ${d.day} ${d.month}`}
          >
            <span className="date-chip-weekday">{d.isToday ? 'Today' : d.weekday}</span>
            <span className="date-chip-day">{d.day}</span>
          </button>
        );
      })}
    </div>
  );
}
