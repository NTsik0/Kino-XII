import { request } from './client';

const unwrap = (res) => res?.data;

// Auth
export const register = (formData) => request('/register', { method: 'POST', body: formData }).then(unwrap);
export const login = (credentials) => request('/login', { method: 'POST', body: credentials }).then(unwrap);
export const logout = () => request('/logout', { method: 'POST', auth: true, replay: false });
export const fetchMe = () => request('/me', { auth: true, replay: false }).then(unwrap);

// Profile
export const updateProfile = (formData) =>
  // multipart PUT is not parsed by every backend; Laravel style method spoofing keeps it safe.
  request('/profile', { method: 'POST', body: withMethod(formData, 'PUT'), auth: true }).then(unwrap);

function withMethod(formData, method) {
  formData.append('_method', method);
  return formData;
}

// Catalogue
export const searchTitles = (q, signal) => request('/search', { query: { q }, signal }).then(unwrap);
export const fetchNowPlaying = (limit) => request('/movies/now-playing', { query: { limit } }).then(unwrap);
export const fetchComingSoon = (limit) => request('/movies/coming-soon', { query: { limit } }).then(unwrap);
export const fetchFeatured = () => request('/movies/featured').then(unwrap);
export const fetchMovie = (slug) => request(`/movies/${encodeURIComponent(slug)}`).then(unwrap);
export const fetchMovieSessions = (slug, date, signal) =>
  request(`/movies/${encodeURIComponent(slug)}/sessions`, { query: { date }, signal }).then(unwrap);
export const notifyMe = (slug) =>
  request(`/movies/${encodeURIComponent(slug)}/notify`, { method: 'POST', auth: true }).then(unwrap);

// Sessions
export const fetchFilterOptions = () => request('/filter-options').then(unwrap);
export const fetchSessions = (query, signal) => request('/sessions', { query, signal });
export const fetchSession = (id) => request(`/sessions/${id}`).then(unwrap);
export const fetchSeatMap = (id) => request(`/sessions/${id}/seats`).then(unwrap);

// Booking
export const createHold = (sessionId, seats) =>
  request(`/sessions/${sessionId}/holds`, { method: 'POST', body: { seats }, auth: true }).then(unwrap);
export const releaseHold = (holdId) =>
  request(`/holds/${holdId}`, { method: 'DELETE', auth: true, replay: false });
export const createOrder = (payload) =>
  request('/orders', { method: 'POST', body: payload, auth: true }).then(unwrap);

// Tickets
export const fetchTickets = (filter) => request('/tickets', { query: { filter }, auth: true }).then(unwrap);
export const refundOrder = (reference) =>
  request(`/orders/${encodeURIComponent(reference)}/refund`, { method: 'POST', auth: true }).then(unwrap);
