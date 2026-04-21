import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://wcag-n7xg.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── 訪客 fingerprint ───────────────────────────────────────────────────────
// 每次請求自動帶上 X-Guest-ID header（後端用來識別匿名使用者）
// 採用 localStorage UUID：比 IP 更精準，不受 NAT/VPN 影響
api.interceptors.request.use((config) => {
  try {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem('guestId', guestId);
    }
    config.headers['X-Guest-ID'] = guestId;
  } catch {
    // localStorage 不可用時忽略（某些 private browsing 模式）
  }
  return config;
});

export const runScan         = (url)      => api.post('/api/scan', { url }).then((r) => r.data);
export const getScanHistory  = ()         => api.get('/api/scan/history').then((r) => r.data);
export const getScanDetail   = (id)       => api.get(`/api/scan/${id}`).then((r) => r.data);
export const getSubscription = ()         => api.get('/api/stripe/subscription').then((r) => r.data);
export const syncSubscription= ()         => api.post('/api/stripe/sync').then((r) => r.data);
export const createCheckout  = (priceId)  => api.post('/api/stripe/checkout', { priceId }).then((r) => r.data);
export const createPortal    = ()         => api.post('/api/stripe/portal').then((r) => r.data);
export const cancelSubscription = ()      => api.post('/api/stripe/cancel').then((r) => r.data);
export const getReportUrl    = (scanId)   => API_URL + '/api/report/pdf/' + scanId;
export const generateRepair  = (url, violations) => api.post('/api/repair', { url, violations }).then((r) => r.data);
