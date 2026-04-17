import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://wcag-n7xg.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const runScan = (url) => api.post('/api/scan', { url }).then((r) => r.data);
export const getScanHistory = () => api.get('/api/scan/history').then((r) => r.data);
export const getScanDetail = (id) => api.get(`/api/scan/${id}`).then((r) => r.data);
export const getSubscription = () => api.get('/api/stripe/subscription').then((r) => r.data);
export const createCheckout = (priceId) => api.post('/api/stripe/checkout', { priceId }).then((r) => r.data);
export const createPortal = () => api.post('/api/stripe/portal').then((r) => r.data);
export const cancelSubscription = () => api.post('/api/stripe/cancel').then((r) => r.data);
export const getReportUrl = (scanId) => API_URL + '/api/report/pdf/' + scanId;
export const generateRepair = (url, violations) => api.post('/api/repair', { url, violations }).then((r) => r.data);
