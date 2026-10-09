import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FormField from '../FormField';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { useFilterOptions } from '../../context/FilterOptionsContext';
import { useToast } from '../../context/ToastContext';
import useForm from '../../hooks/useForm';
import { updateProfile } from '../../api/endpoints';
import { todayISO } from '../../utils/format';
import {
  ageFrom,
  compact,
  validateAvatar,
  validateDateOfBirth,
  validateFullName,
  validateMobile,
} from '../../utils/validators';
import { initials } from '../../utils/format';
import '../auth/Auth.css';

function validate(v) {
  return compact({
    fullName: validateFullName(v.fullName),
    mobileNumber: validateMobile(v.mobileNumber),
    dateOfBirth: validateDateOfBirth(v.dateOfBirth),
  });
}

const toValues = (user) => ({
  fullName: user.fullName || '',
  mobileNumber: user.mobileNumber || '',
  dateOfBirth: user.dateOfBirth || '',
  preferredVenueId: user.preferredVenue?.id ? String(user.preferredVenue.id) : '',
});

/** "You are 15, you cannot buy tickets for 16+ or 18+ titles" — built from the API's rating list. */
function eligibility(age, ratings) {
  if (age === null || age === undefined) return null;
  const blocked = ratings.filter((r) => r.minAge > age).map((r) => r.code);
  if (!blocked.length) return { ok: true, text: `You are ${age}, you can buy tickets for all age ratings.` };
  const list = blocked.length > 1 ? `${blocked.slice(0, -1).join(', ')} or ${blocked[blocked.length - 1]}` : blocked[0];
  return { ok: false, text: `You are ${age}, you cannot buy tickets for ${list} titles.` };
}

export default function PersonalInfoForm() {
  const { user, setUser } = useAuth();
  const { venues, ageRatings } = useFilterOptions();
  const toast = useToast();
  const initial = useMemo(() => toValues(user), [user]);
  const form = useForm(initial, validate);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [avatar, setAvatar] = useState(null); // a newly picked file, not yet saved
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const fileRef = useRef(null);

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

  const normalize = useCallback(
    (v) => ({ ...v, fullName: v.fullName.trim(), mobileNumber: v.mobileNumber.replace(/\s+/g, '') }),
    [],
  );
  const dirty = Boolean(avatar) || JSON.stringify(normalize(form.values)) !== JSON.stringify(normalize(initial));

  // Use the saved age once valid; preview the typed date while editing.
  const previewAge = !form.errors.dateOfBirth && form.values.dateOfBirth ? ageFrom(form.values.dateOfBirth) : user.age;
  const notice = eligibility(previewAge, ageRatings);

  const submit = async (e) => {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid || !dirty || saving) return;
    setSaving(true);
    setFormError(null);
    const v = normalize(form.values);
    const fd = new FormData();
    fd.append('fullName', v.fullName);
    fd.append('mobileNumber', v.mobileNumber);
    fd.append('dateOfBirth', v.dateOfBirth);
    if (v.preferredVenueId) fd.append('preferredVenueId', v.preferredVenueId);
    else fd.append('preferredVenueId', '');
    if (avatar) fd.append('avatar', avatar);
    try {
      const saved = await updateProfile(fd);
      // Show what the server stored, not what we sent.
      setUser(saved);
      form.reset(toValues(saved));
      setAvatar(null);
      toast.success(saved.profileComplete ? 'Profile saved. You can now book tickets.' : 'Profile saved.');
    } catch (err) {
      if (err?.cancelled) return;
      if (err.status === 422 && err.errors) {
        const { avatar: avatarMsg, ...rest } = err.fieldErrors;
        if (avatarMsg) setAvatarError(avatarMsg);
        form.applyServerErrors(rest);
      } else setFormError(err.message);
    } finally {
      setSaving(false);
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
    <form className="profile-form" onSubmit={submit} noValidate>
      {user.profileComplete ? (
        <div className="profile-banner is-complete">
          <Icon name="check" size={16} /> Profile Complete ✓
        </div>
      ) : (
        <div className="profile-banner is-incomplete" role="status">
          <Icon name="alert" size={16} /> Please complete your profile to enable booking.
        </div>
      )}

      {formError && (
        <div className="form-alert" role="alert">
          <Icon name="alert" size={16} />
          <span>{formError}</span>
        </div>
      )}

      <div className={`avatar-upload ${avatarError ? 'is-invalid' : ''}`}>
        <button
          type="button"
          className="avatar-upload-thumb profile-avatar-thumb"
          onClick={() => fileRef.current?.click()}
          aria-label="Change avatar"
        >
          {avatarPreview || user.avatar ? (
            <img src={avatarPreview || user.avatar} alt="Your avatar" />
          ) : (
            <span className="profile-avatar-initials">{initials(user.fullName || user.username)}</span>
          )}
        </button>
        <div>
          <button type="button" className="avatar-upload-title" onClick={() => fileRef.current?.click()}>
            {user.avatar || avatar ? 'Change avatar' : 'Upload avatar'}
          </button>
          <p className="avatar-upload-hint">
            {avatarError || (avatar ? 'New photo selected. Save changes to keep it.' : 'JPG, PNG or WEBP, up to 2MB')}
          </p>
          {avatar && (
            <button type="button" className="avatar-upload-remove" onClick={() => setAvatar(null)}>
              Cancel
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

      <FormField
        label="Full Name"
        placeholder="Name Surname"
        autoComplete="name"
        maxLength={60}
        {...field('fullName')}
      />
      <FormField
        label="Email"
        name="email"
        value={user.email}
        disabled
        hint="Set at registration and can't be changed."
        showValid={false}
      />
      <FormField
        label="Mobile Number"
        placeholder="5XX XXX XXX"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={11}
        {...field('mobileNumber')}
      />
      <FormField label="Date of Birth" {...field('dateOfBirth')}>
        <input
          id="f-dateOfBirth"
          type="date"
          value={form.values.dateOfBirth}
          max={todayISO()}
          min="1900-01-01"
          onChange={(e) => form.setField('dateOfBirth', e.target.value)}
          onBlur={() => form.touch('dateOfBirth')}
          aria-invalid={form.touched.dateOfBirth && form.errors.dateOfBirth ? 'true' : undefined}
        />
      </FormField>
      {notice && (
        <p className={`eligibility ${notice.ok ? 'is-ok' : 'is-limited'}`}>
          <Icon name={notice.ok ? 'check' : 'info'} size={14} /> {notice.text}
        </p>
      )}
      <FormField label="Preferred Venue (optional)" name="preferredVenueId" showValid={false}>
        <select
          id="f-preferredVenueId"
          value={form.values.preferredVenueId}
          onChange={(e) => form.setField('preferredVenueId', e.target.value)}
        >
          <option value="">No preference</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.city}
            </option>
          ))}
        </select>
      </FormField>

      <button type="submit" className="btn btn-primary" disabled={!dirty || !form.isValid || Boolean(avatarError) || saving}>
        {saving ? (
          <>
            <span className="spinner" /> Saving…
          </>
        ) : (
          'Save changes'
        )}
      </button>
    </form>
  );
}
