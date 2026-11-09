import { getContent, saveContent } from './offline';
const API = import.meta.env.VITE_API_URL || '';
export async function health() {
  const response = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}
export async function api(path, options = {}, token) {
  const response = await fetch(`${API}/api/v1/${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }, signal: options.signal || AbortSignal.timeout(15000) });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) { const error = new Error(body.error?.message || 'Unable to connect. Please try again.'); error.status = response.status; error.code = body.error?.code; throw error; }
  return body;
}
export async function fetchContent(key, path, remoteUrl) {
  try {
    let data;
    try { data = await api(`content/${path}`); } catch (error) { if (error.status && error.status < 500) throw error; const response = await fetch(remoteUrl, { signal: AbortSignal.timeout(15000) }); if (!response.ok) throw new Error('The content source is temporarily unavailable.'); data = await response.json(); }
    await saveContent(key, data).catch(() => {});
    return { data, offline: false };
  } catch (error) {
    const cached = await getContent(key);
    if (cached) return { data: cached, offline: true };
    throw error;
  }
}
export const directQuranUrl = path => `https://api.alquran.cloud/v1/${path}`;
export function normalizeSurah(payload) { return payload.surahs || payload.data; }
export function normalizeReader(payload) {
  if (payload.surah) return payload;
  const [surah, translation, transliteration] = payload.data;
  return { surah, translation, transliteration, editions: payload.data.map(d => d.edition), source: 'https://alquran.cloud/api' };
}