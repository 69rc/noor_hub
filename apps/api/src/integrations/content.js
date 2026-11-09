const cache = new Map();
export async function cachedJson(key, url, ttl = 3600000) {
  const previous = cache.get(key);
  if (previous && previous.expires > Date.now()) return previous.data;
  if (previous?.promise) return previous.promise;
  const promise = fetch(url, { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json', 'User-Agent': 'NoorHub/1.0 (educational Islamic app)' } }).then(async response => {
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const data = await response.json();
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    cache.set(key, { data, expires: Date.now() + ttl });
    return data;
  }).catch(error => {
    cache.delete(key);
    if (previous) return previous.data;
    throw error;
  });
  cache.set(key, { data: previous?.data, expires: previous?.expires || 0, promise });
  return promise;
}
export const quranApi = path => cachedJson(`quran:${path}`, `https://api.alquran.cloud/v1/${path}`, 86400000);
export const hadithApi = (edition, number) => cachedJson(`hadith:${edition}:${number}`, `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}/${number}.json`, 86400000);