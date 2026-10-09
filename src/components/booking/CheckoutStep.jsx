import { useCallback, useRef, useState } from 'react';
import FormField from '../FormField';
import Icon from '../Icon';
import useForm from '../../hooks/useForm';
import { money } from '../../utils/format';
import {
  compact,
  validateCardNumber,
  validateCvv,
  validateEmail,
  validateExpiry,
  validateFullName,
  validateMobile,
} from '../../utils/validators';

function validate(v) {
  return compact({
    fullName: validateFullName(v.fullName),
    email: validateEmail(v.email),
    mobileNumber: validateMobile(v.mobileNumber),
    cardNumber: validateCardNumber(v.cardNumber),
    expiry: validateExpiry(v.expiry),
    cvv: validateCvv(v.cvv),
  });
}

const formatCard = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (value, previous) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  // Let backspace remove the slash naturally.
  if (digits.length <= 2) return value.length < previous.length ? digits : digits.length === 2 ? `${digits}/` : digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export default function CheckoutStep({ user, hold, ticketTypes, onBack, onPay }) {
  const form = useForm(
    {
      fullName: user.fullName || '',
      email: user.email || '',
      mobileNumber: user.mobileNumber || '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    },
    validate,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const inFlight = useRef(false);

  const setField = useCallback(
    (name, value) => {
      if (name === 'cardNumber') form.setField(name, formatCard(value));
      else if (name === 'expiry') form.setField(name, formatExpiry(value, form.values.expiry));
      else if (name === 'cvv') form.setField(name, value.replace(/\D/g, '').slice(0, 3));
      else form.setField(name, value);
    },
    [form],
  );

  const submit = async (e) => {
    e.preventDefault();
    form.touchAll();
    // The ref blocks a second submit even before React re-renders the disabled button.
    if (!form.isValid || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      await onPay({
        holdId: hold.holdId,
        fullName: form.values.fullName.trim(),
        email: form.values.email.trim(),
        mobileNumber: form.values.mobileNumber.replace(/\s+/g, ''),
        cardNumber: form.values.cardNumber.replace(/\s+/g, ''),
        expiry: form.values.expiry,
        cvv: form.values.cvv,
      });
    } catch (err) {
      if (err?.status === 422 && err.errors) form.applyServerErrors(err.fieldErrors);
      else if (err && !err.handled) setFormError(err.message);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const field = (name) => ({
    name,
    value: form.values[name],
    onChange: setField,
    onBlur: form.touch,
    error: form.errors[name],
    touched: form.touched[name],
  });

  const typeName = (seat) => seat.ticketType?.name || ticketTypes.find((t) => t.slug === seat.ticketType?.slug)?.name;

  return (
    <form className="checkout" onSubmit={submit} noValidate>
      <div className="checkout-form">
        {formError && (
          <div className="form-alert" role="alert">
            <Icon name="alert" size={16} />
            <span>{formError}</span>
          </div>
        )}
        <h3 className="checkout-heading">Buyer details</h3>
        <FormField label="Full Name" autoComplete="name" {...field('fullName')} />
        <div className="field-row">
          <FormField label="Email" type="email" autoComplete="email" {...field('email')} />
          <FormField
            label="Mobile Number"
            inputMode="numeric"
            placeholder="5XX XXX XXX"
            autoComplete="tel-national"
            {...field('mobileNumber')}
          />
        </div>

        <h3 className="checkout-heading">Card details</h3>
        <FormField
          label="Card Number"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          autoComplete="cc-number"
          {...field('cardNumber')}
        />
        <div className="field-row">
          <FormField
            label="Expiry"
            inputMode="numeric"
            placeholder="MM/YY"
            autoComplete="cc-exp"
            {...field('expiry')}
          />
          <FormField
            label="CVV"
            inputMode="numeric"
            placeholder="123"
            autoComplete="cc-csc"
            type="password"
            {...field('cvv')}
          />
        </div>
        <p className="checkout-note">
          <Icon name="info" size={13} /> Payment is simulated. Only the last four digits of the card are kept.
        </p>
      </div>

      <aside className="checkout-summary">
        <h3 className="selection-title">Order summary</h3>
        <ul className="price-lines">
          {hold.seats.map((seat) => (
            <li key={seat.seatId}>
              <span>
                Seat <strong>{seat.code}</strong> · {typeName(seat)}
              </span>
              <span>{money(seat.price)}</span>
            </li>
          ))}
        </ul>
        <div className="subtotal">
          <span>Total</span>
          <strong>{money(hold.subtotal)}</strong>
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner" /> Processing payment…
            </>
          ) : (
            `Pay ${money(hold.subtotal)} & Complete Order`
          )}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onBack} disabled={submitting}>
          <Icon name="chevronLeft" size={15} /> Back to seats
        </button>
      </aside>
    </form>
  );
}
