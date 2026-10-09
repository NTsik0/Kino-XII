import { useCallback, useEffect, useState } from 'react';
import Modal from '../Modal';
import FormField from '../FormField';
import Icon from '../Icon';
import useForm from '../../hooks/useForm';
import { compact, validateEmail, validatePassword } from '../../utils/validators';
import './Auth.css';

const initial = { email: '', password: '' };

export default function LoginModal({ open, onClose, onLogin, onSwitch, reason }) {
  const validate = useCallback(
    (v) => compact({ email: validateEmail(v.email), password: validatePassword(v.password) }),
    [],
  );
  const form = useForm(initial, validate);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Fresh form each time the modal opens; the email survives failed attempts.
  useEffect(() => {
    if (open) {
      form.reset(initial);
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onLogin({ email: form.values.email.trim(), password: form.values.password });
    } catch (err) {
      if (err.status === 422 && err.errors) form.applyServerErrors(err.fieldErrors);
      else setFormError(err.message || 'Could not log you in.');
      // Values are kept, so the email stays filled in for the next attempt.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log in" subtitle="Welcome back to Kino XII" width={400}>
      <form onSubmit={submit} noValidate className="auth-form">
        {reason && !formError && (
          <div className="form-alert is-warning">
            <Icon name="info" size={16} />
            <span>{reason}</span>
          </div>
        )}
        {formError && (
          <div className="form-alert" role="alert">
            <Icon name="alert" size={16} />
            <span>{formError}</span>
          </div>
        )}
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="example@gmail.com"
          autoComplete="email"
          value={form.values.email}
          onChange={form.setField}
          onBlur={form.touch}
          error={form.errors.email}
          touched={form.touched.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={form.values.password}
          onChange={form.setField}
          onBlur={form.touch}
          error={form.errors.password}
          touched={form.touched.password}
        />
        <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={!form.isValid || submitting}>
          {submitting ? (
            <>
              <span className="spinner" /> Logging in…
            </>
          ) : (
            'Log in'
          )}
        </button>
        <p className="modal-footer-note">
          Don&apos;t have an account?{' '}
          <button type="button" className="link-accent" onClick={onSwitch}>
            Sign up
          </button>
        </p>
      </form>
    </Modal>
  );
}
