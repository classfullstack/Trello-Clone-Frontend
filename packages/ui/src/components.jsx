import {
  createContext, useContext, useState, useRef, useEffect, useCallback, useId,
} from 'react';
import { createPortal } from 'react-dom';
import { color, space, radius, shadow, font, focusRing } from './tokens';

/* ------------------------------------------------------------------ Spinner */

export function Spinner({ size = 20, color: c = color.blue, style }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block', width: size, height: size,
        border: `2px solid ${color.lightGray}`, borderTopColor: c,
        borderRadius: '50%', animation: 'trello-spin 0.6s linear infinite', ...style,
      }}
    />
  );
}

export function Skeleton({ width = '100%', height = 16, radius: r = radius.base, style }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'block', width, height, borderRadius: r,
        background: 'linear-gradient(90deg, #ECEDF0 25%, #F4F5F7 37%, #ECEDF0 63%)',
        backgroundSize: '400% 100%', animation: 'trello-shimmer 1.4s ease infinite', ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------- Button */

const btnVariants = {
  primary: {
    base: { background: color.blue, color: color.white, border: '1px solid transparent', boxShadow: shadow.subtle },
    hover: { background: color.blueBright },
    active: { background: color.blueDark },
  },
  secondary: {
    base: { background: color.white, color: color.navyMedium, border: `1px solid ${color.border}` },
    hover: { background: color.offWhite },
    active: { background: color.lightGray },
  },
  ghost: {
    base: { background: 'transparent', color: color.navyMedium, border: '1px solid transparent' },
    hover: { background: color.offWhite },
    active: { background: color.lightGray },
  },
  subtle: {
    base: { background: 'rgba(9,30,66,0.06)', color: color.navyMedium, border: '1px solid transparent' },
    hover: { background: 'rgba(9,30,66,0.10)' },
    active: { background: 'rgba(9,30,66,0.16)' },
  },
  danger: {
    base: { background: color.danger, color: color.white, border: '1px solid transparent' },
    hover: { background: '#B5261B' },
    active: { background: '#8E1A12' },
  },
};

const btnSizes = {
  sm: { minHeight: 32, padding: '4px 12px', fontSize: 14 },
  md: { minHeight: 40, padding: '8px 16px', fontSize: 14 },
  lg: { minHeight: 44, padding: '10px 20px', fontSize: 16 },
};

export function Button({
  variant = 'primary', size = 'md', loading = false, fullWidth = false,
  leftIcon, rightIcon, disabled, style, children, ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const v = btnVariants[variant] ?? btnVariants.primary;
  const isDisabled = disabled || loading;

  const composed = {
    fontFamily: font.text, fontWeight: 500, lineHeight: '20px',
    borderRadius: radius.primary, cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: space.sm,
    transition: 'background .12s ease, box-shadow .12s ease, opacity .12s',
    width: fullWidth ? '100%' : undefined, whiteSpace: 'nowrap',
    ...btnSizes[size], ...v.base,
    ...(!isDisabled && hover ? v.hover : null),
    ...(!isDisabled && active ? v.active : null),
    ...(isDisabled ? { opacity: 0.6 } : null),
    ...style,
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      style={composed}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onFocus={(e) => { e.currentTarget.style.boxShadow = focusRing; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = v.base.boxShadow ?? 'none'; }}
      {...rest}
    >
      {loading && <Spinner size={14} color={v.base.color} />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export function IconButton({ label, size = 32, active = false, style, children, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        width: size, height: size, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', border: 'none', borderRadius: radius.base, cursor: 'pointer',
        background: active ? color.lightGray : hover ? color.offWhite : 'transparent',
        color: color.navyMedium, transition: 'background .12s', ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => { e.currentTarget.style.boxShadow = focusRing; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Input */

export function Input({ label, error, helper, id, style, wrapStyle, ...rest }) {
  const auto = useId();
  const inputId = id ?? auto;
  const [focused, setFocused] = useState(false);
  const borderColor = error ? color.danger : focused ? color.blue : color.border;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: font.text, fontSize: 12, fontWeight: 600, color: color.darkGray }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          fontFamily: font.text, fontSize: 14, lineHeight: '24px', minHeight: 40,
          padding: '8px 12px', borderRadius: radius.primary,
          border: `1px solid ${borderColor}`, color: color.navyDeep,
          background: error ? color.errorBg : color.white,
          outline: 'none', width: '100%', boxSizing: 'border-box',
          boxShadow: focused ? focusRing : 'none', transition: 'border-color .12s, box-shadow .12s',
          ...style,
        }}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        {...rest}
      />
      {error ? (
        <span style={{ fontFamily: font.text, fontSize: 12, color: color.danger }}>{error}</span>
      ) : helper ? (
        <span style={{ fontFamily: font.text, fontSize: 12, color: color.navyLight }}>{helper}</span>
      ) : null}
    </div>
  );
}

export function Textarea({ label, error, helper, id, style, wrapStyle, ...rest }) {
  const auto = useId();
  const taId = id ?? auto;
  const [focused, setFocused] = useState(false);
  const borderColor = error ? color.danger : focused ? color.blue : color.border;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs, ...wrapStyle }}>
      {label && (
        <label htmlFor={taId} style={{ fontFamily: font.text, fontSize: 12, fontWeight: 600, color: color.darkGray }}>
          {label}
        </label>
      )}
      <textarea
        id={taId}
        style={{
          fontFamily: font.text, fontSize: 14, lineHeight: '21px', minHeight: 80,
          padding: '8px 12px', borderRadius: radius.primary,
          border: `1px solid ${borderColor}`, color: color.navyDeep,
          background: color.white, outline: 'none', width: '100%', boxSizing: 'border-box',
          resize: 'vertical', boxShadow: focused ? focusRing : 'none',
          transition: 'border-color .12s, box-shadow .12s', ...style,
        }}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        {...rest}
      />
      {error && <span style={{ fontFamily: font.text, fontSize: 12, color: color.danger }}>{error}</span>}
      {!error && helper && <span style={{ fontFamily: font.text, fontSize: 12, color: color.navyLight }}>{helper}</span>}
    </div>
  );
}

export function Select({ label, error, id, style, wrapStyle, children, ...rest }) {
  const auto = useId();
  const selId = id ?? auto;
  const [focused, setFocused] = useState(false);
  const borderColor = error ? color.danger : focused ? color.blue : color.border;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs, ...wrapStyle }}>
      {label && (
        <label htmlFor={selId} style={{ fontFamily: font.text, fontSize: 12, fontWeight: 600, color: color.darkGray }}>
          {label}
        </label>
      )}
      <select
        id={selId}
        style={{
          fontFamily: font.text, fontSize: 14, minHeight: 40, padding: '8px 12px',
          borderRadius: radius.primary, border: `1px solid ${borderColor}`,
          color: color.navyDeep, background: color.white, outline: 'none', width: '100%',
          boxSizing: 'border-box', cursor: 'pointer', boxShadow: focused ? focusRing : 'none', ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

/* --------------------------------------------------------------------- Card */

export function Card({ children, hoverable = false, style, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        background: color.white, border: `1px solid ${color.border}`, borderRadius: radius.large,
        padding: space.lg, boxShadow: hover && hoverable ? shadow.hover : shadow.subtle,
        color: color.navyDeep, transition: 'box-shadow .15s, transform .15s',
        transform: hover && hoverable ? 'translateY(-2px)' : 'none', ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- Badge */

export function Badge({ kind = 'default', children, style }) {
  const kinds = {
    default: { background: color.offWhite, color: color.navyDeep, border: `1px solid ${color.lightGray}` },
    success: { background: '#E8F5E9', color: color.success, border: `1px solid ${color.success}` },
    error: { background: color.errorBg, color: color.danger, border: `1px solid ${color.danger}` },
    primary: { background: color.primaryBadgeBg, color: color.blue, border: `1px solid ${color.blue}` },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: radius.badge,
      padding: '2px 8px', fontSize: 12, fontWeight: 600, lineHeight: '16px',
      fontFamily: font.text, ...kinds[kind], ...style,
    }}>{children}</span>
  );
}

// Trello-style color chip (board labels).
export function LabelChip({ color: bg, name, compact = false, style }) {
  return (
    <span
      title={name}
      style={{
        display: 'inline-flex', alignItems: 'center', background: bg,
        color: '#1D2125', fontFamily: font.text, fontSize: 12, fontWeight: 600,
        borderRadius: radius.base, height: compact ? 8 : 20,
        minWidth: compact ? 40 : 0, padding: compact ? 0 : '0 8px',
        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...style,
      }}
    >
      {!compact && name}
    </span>
  );
}

/* ------------------------------------------------------------------- Avatar */

function hashColor(str) {
  const palette = ['#1868DB', '#A855F7', '#06B6D4', '#0EA47A', '#E8590C', '#C9372C', '#6554C0', '#0747A6'];
  let h = 0;
  for (let i = 0; i < (str || '').length; i += 1) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export function Avatar({ name, email, src, size = 32, style, title }) {
  const label = name || email || '?';
  const initials = label.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const base = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: font.text, fontWeight: 600, fontSize: Math.round(size * 0.42),
    color: color.white, userSelect: 'none', ...style,
  };
  if (src) {
    return <img src={src} alt={label} title={title ?? label} style={{ ...base, objectFit: 'cover' }} />;
  }
  return <span title={title ?? label} style={{ ...base, background: hashColor(label) }}>{initials}</span>;
}

/* -------------------------------------------------------------------- Modal */

const modalSizes = { sm: 420, md: 560, lg: 720, xl: 880 };

export function Modal({ open, onClose, title, size = 'md', width, footer, headerExtra, children, padded = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  useEffect(() => {
    if (open && ref.current) {
      const focusable = ref.current.querySelector('input, textarea, button, [tabindex]');
      focusable?.focus?.();
    }
  }, [open]);

  if (!open) return null;
  const maxWidth = width ?? modalSizes[size] ?? modalSizes.md;

  return createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000, padding: space.lg, overflowY: 'auto',
        animation: 'trello-fade .12s ease',
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        style={{
          background: color.white, borderRadius: radius.large, boxShadow: shadow.modal,
          maxWidth, width: '100%', marginTop: '6vh', marginBottom: '6vh',
          animation: 'trello-pop .14s ease', display: 'flex', flexDirection: 'column',
        }}
      >
        {(title || headerExtra) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md,
            padding: `${space.lg} ${space.lg} ${space.base}`, borderBottom: `1px solid ${color.offWhite}`,
          }}>
            <h2 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 600, color: color.navyDeep, margin: 0 }}>
              {title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
              {headerExtra}
              <IconButton label="Close" onClick={onClose}>✕</IconButton>
            </div>
          </div>
        )}
        <div style={{ padding: padded ? space.lg : 0, overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: space.sm,
            padding: space.lg, borderTop: `1px solid ${color.offWhite}`,
          }}>{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------------------------------------------- Dropdown */

export function Dropdown({ trigger, children, align = 'left', width = 220 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', [align]: 0, width, zIndex: 200,
            background: color.white, border: `1px solid ${color.border}`, borderRadius: radius.large,
            boxShadow: shadow.dropdown, padding: space.xs, animation: 'trello-pop .12s ease',
          }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, danger, children, style, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      role="menuitem"
      style={{
        display: 'flex', alignItems: 'center', gap: space.sm, width: '100%', textAlign: 'left',
        padding: '8px 12px', border: 'none', borderRadius: radius.base, cursor: 'pointer',
        background: hover ? color.offWhite : 'transparent',
        color: danger ? color.danger : color.navyDeep, fontFamily: font.text, fontSize: 14, ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {icon && <span style={{ width: 16, textAlign: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div style={{ height: 1, background: color.offWhite, margin: `${space.xs} 0` }} />;
}

/* ------------------------------------------------------------------ Tooltip */

export function Tooltip({ label, children, side = 'top' }) {
  const [show, setShow] = useState(false);
  const pos = side === 'top'
    ? { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }
    : { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' };
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && label && (
        <span style={{
          position: 'absolute', ...pos, zIndex: 300, whiteSpace: 'nowrap',
          background: color.navyDeep, color: color.white, fontFamily: font.text,
          fontSize: 12, padding: '4px 8px', borderRadius: radius.base, pointerEvents: 'none',
        }}>{label}</span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------- EmptyState */

export function EmptyState({ icon, title, description, action, style }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: `${space.xxl} ${space.lg}`, color: color.navyLight, ...style,
    }}>
      {icon && <div style={{ fontSize: 40, marginBottom: space.base, opacity: 0.7 }}>{icon}</div>}
      {title && <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 600, color: color.navyMedium, marginBottom: space.xs }}>{title}</div>}
      {description && <div style={{ fontFamily: font.text, fontSize: 14, maxWidth: 360, lineHeight: '21px' }}>{description}</div>}
      {action && <div style={{ marginTop: space.lg }}>{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- Toast */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, message, kind: opts.kind ?? 'info', duration: opts.duration ?? 4000 };
    setToasts((t) => [...t, toast]);
    if (toast.duration) setTimeout(() => remove(id), toast.duration);
    return id;
  }, [remove]);

  const value = {
    toast: push,
    success: (m, o) => push(m, { ...o, kind: 'success' }),
    error: (m, o) => push(m, { ...o, kind: 'error' }),
    info: (m, o) => push(m, { ...o, kind: 'info' }),
  };

  const kinds = {
    success: { bg: '#1F6E43', icon: '✓' },
    error: { bg: color.danger, icon: '!' },
    info: { bg: color.navyDeep, icon: 'i' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div style={{
          position: 'fixed', bottom: space.lg, right: space.lg, zIndex: 2000,
          display: 'flex', flexDirection: 'column', gap: space.sm, maxWidth: 360,
        }}>
          {toasts.map((t) => {
            const k = kinds[t.kind] ?? kinds.info;
            return (
              <div key={t.id} role="alert" onClick={() => remove(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: space.md, cursor: 'pointer',
                  background: k.bg, color: color.white, fontFamily: font.text, fontSize: 14,
                  padding: '12px 16px', borderRadius: radius.large, boxShadow: shadow.dropdown,
                  animation: 'trello-slide-in .18s ease',
                }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.2)', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12,
                }}>{k.icon}</span>
                <span style={{ flex: 1 }}>{t.message}</span>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ----------------------------------------------------------- Global styles */

export function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      html, body, #root { margin: 0; height: 100%; }
      body {
        font-family: ${font.text};
        color: ${color.navyDeep};
        background: ${color.offWhite};
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      a { color: ${color.blue}; text-decoration: none; }
      a:hover { color: ${color.blueBright}; }
      button { font-family: inherit; }
      input, textarea, select { font-family: inherit; }
      ::placeholder { color: ${color.mediumGray}; }
      ::-webkit-scrollbar { height: 10px; width: 10px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(9,30,66,0.2); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(9,30,66,0.32); background-clip: padding-box; }
      @keyframes trello-spin { to { transform: rotate(360deg); } }
      @keyframes trello-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
      @keyframes trello-fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes trello-pop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      @keyframes trello-slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
    `}</style>
  );
}
