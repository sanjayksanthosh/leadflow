import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './ui';

type Tone = 'ok' | 'error' | 'info';

interface ToastItem {
  id: number;
  title: string;
  detail?: string;
  tone: Tone;
}

interface ToastApi {
  push: (toast: { title: string; detail?: string; tone?: Tone }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<Tone, IconName> = { ok: 'checkCircle', error: 'alert', info: 'bell' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((toast: { title: string; detail?: string; tone?: Tone }) => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, tone: toast.tone ?? 'ok', ...toast }].slice(-4));
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toasts" role="status" aria-live="polite">
          {items.map((t) => (
            <div className={`toast toast--${t.tone}`} key={t.id}>
              <span className="toast__icon">
                <Icon name={ICONS[t.tone]} size={17} />
              </span>
              <div className="toast__body">
                <strong>{t.title}</strong>
                {t.detail && <span>{t.detail}</span>}
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

/** Closes a popover when clicking outside of it or pressing Escape. */
export function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}
