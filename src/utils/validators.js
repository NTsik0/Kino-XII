const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const v = (value || '').trim();
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 3) return 'Password must be at least 3 characters';
  return null;
}

export function validateFullName(value) {
  const v = (value || '').trim();
  if (!v) return 'Name is required';
  if (v.length < 3) return 'Name must be at least 3 characters';
  if (v.length > 50) return 'Name must not exceed 50 characters';
  return null;
}

/** Georgian mobile: 9 digits starting with 5. Spaces are allowed while typing. */
export function validateMobile(value) {
  const raw = (value || '').trim();
  if (!raw) return 'Mobile number is required';
  const digits = raw.replace(/\s+/g, '');
  if (!/^\d+$/.test(digits)) return 'Please enter a valid Georgian mobile number (9 digits starting with 5)';
  if (digits[0] !== '5') return 'Georgian mobile numbers must start with 5';
  if (digits.length !== 9) return 'Mobile number must be exactly 9 digits';
  return null;
}

export function ageFrom(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function validateDateOfBirth(value) {
  if (!value) return 'Date of birth is required';
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(date.getTime()) || y < 1900 || date > new Date()) return 'Please enter a valid date of birth';
  if (ageFrom(value) < 12) return 'You must be at least 12 years old to create an account';
  return null;
}

export function digitsOnly(value) {
  return (value || '').replace(/\D+/g, '');
}

export function validateCardNumber(value) {
  const digits = (value || '').replace(/\s+/g, '');
  if (!digits) return 'Card number is required';
  if (!/^\d{16}$/.test(digits)) return 'Card number must be 16 digits';
  return null;
}

export function validateExpiry(value) {
  const v = (value || '').trim();
  if (!v) return 'Expiry date is required';
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v);
  if (!match) return 'Use the MM/YY format';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth < now) return 'Expiry date must be in the future';
  return null;
}

export function validateCvv(value) {
  const v = (value || '').trim();
  if (!v) return 'CVV is required';
  if (!/^\d{3}$/.test(v)) return 'CVV must be 3 digits';
  return null;
}

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function validateAvatar(file) {
  if (!file) return null;
  if (!AVATAR_TYPES.includes(file.type)) return 'Avatar must be a JPG, PNG or WebP image';
  if (file.size > AVATAR_MAX_BYTES) return 'Avatar must be smaller than 2MB';
  return null;
}

/** Drop null entries so `{}` means "valid". */
export function compact(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
}
