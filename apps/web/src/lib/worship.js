import { useLocalState } from './hooks';
import { useAuth } from './auth';
import { localDate } from './prayer';
export function usePrayerLog() {
  const [records, setRecords] = useLocalState('sakinah.prayers', {});
  const { enqueue } = useAuth();
  const setPrayer = (date, prayer, status, timezone) => {
    const key = `${date}:${prayer}`;
    const previous = records[key];
    const next = { localDate: date, prayer: prayer.toUpperCase(), timezone, status: status.toUpperCase(), performedAt: status === 'completed' ? new Date().toISOString() : null };
    setRecords(current => ({ ...current, [key]: next }));
    enqueue('prayerLog', previous?.id || crypto.randomUUID(), next).catch(() => {});
    return () => setRecords(current => { const copy = { ...current }; if (previous) copy[key] = previous; else delete copy[key]; return copy; });
  };
  const forDate = date => Object.fromEntries(Object.entries(records).filter(([key]) => key.startsWith(`${date}:`)).map(([key, value]) => [key.split(':')[1], String(value.status).toLowerCase()]));
  const consistency = (days = 7, timezone) => Array.from({ length: days }, (_, index) => { const date = localDate(new Date(Date.now() - (days - index - 1) * 86400000), timezone); const entries = forDate(date); return { date, completed: Object.values(entries).filter(s => s === 'completed').length, tracked: Object.keys(entries).length }; });
  return { records, setPrayer, forDate, consistency };
}