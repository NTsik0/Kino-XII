export const API_BASE = 'https://api.kinoxii.redberryinternship.ge/api';

const TOKEN_KEY = 'kino.token';

export class ApiError extends Error {
  constructor(status, body = {}) {
    super(body.message || defaultMessage(status));
    this.name = 'ApiError';
    this.status = status;
    this.errors = body.errors || null; // 422 field errors
    this.contested = body.contested || null; // 409 seat codes
    this.body = body;
  }

  /** 422 without `errors` = a booking rule blocked it; the message is user-ready. */
  get isRuleError() {
    return this.status === 422 && !this.errors;
  }

  /** Field errors flattened to { field: 'first message' }. */
  get fieldErrors() {
    if (!this.errors) return {};
    return Object.fromEntries(
      Object.entries(this.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
    );
  }
}

function defaultMessage(status) {
  if (status === 0) return 'Network error. Check your connection and try again.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have access to this record.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Request failed.';
}

let token = readToken();

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getToken() {
  return token;
}

export function setToken(value) {
  token = value || null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: keep token in memory only */
  }
}

/*
 * When a protected request returns 401 the auth layer opens the login modal.
 * The handler returns a promise that resolves once the user has logged in
 * (or rejects if they close the modal). The original request is then replayed,
 * so the user never has to click the same button twice.
 */
let reauthHandler = null;
export function setReauthHandler(fn) {
  reauthHandler = fn;
}

let unauthorizedListener = null;
export function onUnauthorized(fn) {
  unauthorizedListener = fn;
}

function buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((v) => params.append(`${key}[]`, v));
    else params.append(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function request(path, options = {}) {
  const { method = 'GET', body, query, signal, auth = false, replay = true } = options;

  const headers = { Accept: 'application/json' };
  const sendToken = token && (auth || method === 'GET');
  if (sendToken) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(API_BASE + path + buildQuery(query), { method, headers, body: payload, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0);
  }

  if (response.status === 204) return null;

  let data = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (response.ok) return data;

  const error = new ApiError(response.status, data);

  if (response.status === 401 && path !== '/login') {
    // A stale token on a public GET: just drop it and retry as a guest.
    if (!auth && sendToken) {
      setToken(null);
      unauthorizedListener?.();
      return request(path, { ...options, replay: false });
    }
    if (auth) {
      setToken(null);
      unauthorizedListener?.();
      if (replay && reauthHandler) {
        await reauthHandler(); // rejects if the user dismisses the login modal
        return request(path, { ...options, replay: false });
      }
    }
  }

  throw error;
}
