import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, X } from 'lucide-react';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, action) => setToast({ message, action, id: Date.now() }), []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), toast.action ? 7000 : 4000); return () => clearTimeout(timer); }, [toast]);
  return <ToastContext.Provider value={notify}>{children}<div className="pointer-events-none fixed inset-x-4 bottom-28 z-[100] flex justify-center md:bottom-8" role="status" aria-live="polite"><AnimatePresence>{toast && <motion.div key={toast.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl bg-emerald-900 px-4 py-3 text-sm text-white shadow-lift"><Check size={18} className="shrink-0 text-sage-200" /><span>{toast.message}</span>{toast.action && <button className="min-h-8 shrink-0 font-bold text-sage-200 underline" onClick={() => { toast.action.onClick(); setToast(null); }}>{toast.action.label}</button>}<button aria-label="Dismiss notification" className="rounded-full p-1" onClick={() => setToast(null)}><X size={16} /></button></motion.div>}</AnimatePresence></div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);