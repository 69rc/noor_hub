import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, health } from './api';
import { getOutbox, queueOperation, removeOperation } from './offline';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncError, setSyncError] = useState('');
  const tokenRef = useRef(null);
  const refreshRef = useRef(null);
  const syncing = useRef(false);
  const setSession = session => { tokenRef.current = session.accessToken; setToken(session.accessToken); setUser(session.user); };
  const refresh = useCallback(async () => {
    if (!refreshRef.current) refreshRef.current = api('auth/refresh', { method: 'POST' }).then(session => { setSession(session); return session; }).finally(() => { refreshRef.current = null; });
    return refreshRef.current;
  }, []);
  useEffect(() => {
    let active = true;
    health().then(info => { if (active && info.accounts) return refresh(); }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [refresh]);
  const authorizedApi = useCallback(async (path, options = {}) => {
    try { return await api(path, options, tokenRef.current); }
    catch (error) { if (error.status !== 401) throw error; const session = await refresh(); return api(path, options, session.accessToken); }
  }, [refresh]);
  const sync = useCallback(async () => {
    if (!tokenRef.current || syncing.current || !navigator.onLine) return;
    syncing.current = true;
    try {
      const operations = await getOutbox();
      setPending(operations.length);
      for (const op of operations) {
        try { await authorizedApi('sync', { method: 'POST', body: JSON.stringify({ operations: [op] }) }); await removeOperation(op.clientOpId); }
        catch (error) { if (error.code === 'VERSION_CONFLICT') { setSyncError('A newer record exists on another device. Export your local journal before resolving the conflict.'); break; } if (error.status === 401 || error.status === 403) break; throw error; }
      }
      setPending((await getOutbox()).length);
    } catch { setPending((await getOutbox()).length); }
    finally { syncing.current = false; }
  }, [authorizedApi]);
  useEffect(() => { if (user) sync(); window.addEventListener('online', sync); return () => window.removeEventListener('online', sync); }, [user, sync]);
  const enqueue = useCallback(async (entityType, entityId, payload, action = 'UPDATE', baseVersion) => {
    const op = { clientOpId: crypto.randomUUID(), entityType, entityId, action, payload, ...(baseVersion ? { baseVersion } : {}) };
    await queueOperation(op); setPending((await getOutbox()).length);
    if (tokenRef.current) await sync();
    return op;
  }, [sync]);
  const login = async data => { const session = await api('auth/login', { method: 'POST', body: JSON.stringify(data) }); setSession(session); return session.user; };
  const register = async data => { const session = await api('auth/register', { method: 'POST', body: JSON.stringify(data) }); setSession(session); return session.user; };
  const logout = async () => { await api('auth/logout', { method: 'POST' }).catch(() => {}); tokenRef.current = null; setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ user, token, ready, login, register, logout, authorizedApi, enqueue, sync, pending, syncError }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);