import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '../Modal';
import FormField from '../FormField';
import Icon from '../Icon';
import useForm from '../../hooks/useForm';
import { compact, validateAvatar, validateEmail, validatePassword } from '../../utils/validators';
import './Auth.css';

const initial = { username: '', email: '', password: '', confirmPassword: '' };

function validate(v) {
  let username = null;
  const name = v.username.trim();
  if (!name) username = 'Username is required';
  else if (name.length < 3) username = 'Username must be at least 3 characters';

  let confirmPassword = null;
  if (!v.confirmPassword) confirmPassword = 'Please confirm your password';
  else if (v.confirmPassword !== v.password) confirmPassword = 'Passwords do not match';

  return compact({
    username,
    email: validateEmail(v.email),
    password: validatePassword(v.password),
    confirmPassword,
  });
}

export default function RegisterModal({ open, onClose, onRegister, onSwitch }) {
  const form = useForm(initial, validate);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      form.reset(initial);
      setAvatar(null);
      setAvatarError(null);
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Object URL for the preview, revoked when it changes.
  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(avatar);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const error = validateAvatar(file);
    setAvatarError(error);
    setAvatar(error ? null : file);
  };

  const submit = async (e) => {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid || avatarError || submitting) return;
    setSubmitting(true);
    setFormError(null);
    const fd = new FormData();
    fd.append('username', form.values.username.trim());
    fd.append('email', form.values.email.trim());
    fd.append('password', form.values.password);
    fd.append('password_confirmation', form.values.confirmPassword);
    if (avatar) fd.append('avatar', avatar);
    try {
      await onRegister(fd);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const { avatar: avatarMsg, ...rest } = err.fieldErrors;
        if (avatarMsg) setAvatarError(avatarMsg);
        form.applyServerErrors(rest, { password_confirmation: 'confirmPassword' });
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name) => ({
    name,
    value: form.values[name],
    onChange: form.setField,
    onBlur: form.touch,
    error: form.errors[name],
    touched: form.touched[name],
  });

  return (
    <Modal open={open} onClose={onClose} title="Sign up" subtitle="Welcome to Kino XII" width={440}>
      <form onSubmit={submit} noValidate className="auth-form">
        {formError && (
          <div className="form-alert" role="alert">
            <Icon name="alert" size={16} />
            <span>{formError}</span>
          </div>
        )}

        <div className={`avatar-upload ${avatarError ? 'is-invalid' : ''}`}>
          <button
            type="button"
            className="avatar-upload-thumb"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload avatar"
          >
            {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <Icon name="upload" size={16} />}
          </button>
          <div>
            <button type="button" className="avatar-upload-title" onClick={() => fileRef.current?.click()}>
              {avatar ? 'Change avatar' : 'Upload avatar (optional)'}
            </button>
            <p className="avatar-upload-hint">{avatarError || 'JPG, PNG or WEBP'}</p>
            {avatar && (
              <button type="button" className="avatar-upload-remove" onClick={() => setAvatar(null)}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={pickAvatar}
            tabIndex={-1}
          />
        </div>

        <FormField label="Username" placeholder="User" autoComplete="username" {...field('username')} />
        <FormField label="Email" type="email" placeholder="example@gmail.com" autoComplete="email" {...field('email')} />
        <div className="field-row">
          <FormField label="Password" type="password" placeholder="••••••••" autoComplete="new-password" {...field('password')} />
          <FormField
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...field('confirmPassword')}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block auth-submit"
          disabled={!form.isValid || Boolean(avatarError) || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner" /> Creating account…
            </>
          ) : (
            'Sign up'
          )}
        </button>
        <p className="modal-footer-note">
          Already have an account?{' '}
          <button type="button" className="link-accent" onClick={onSwitch}>
            Log in
          </button>
        </p>
      </form>
    </Modal>
  );
}
