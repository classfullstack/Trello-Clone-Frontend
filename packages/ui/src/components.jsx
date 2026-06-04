import { color, space, radius, shadow, font, focusRing } from './tokens';

export function Button({
  variant = 'primary', style, children, ...rest
}) {
  const base = {
    fontFamily: font.text, fontSize: 16, lineHeight: '24px', minHeight: 40,
    padding: '8px 20px', borderRadius: radius.primary, cursor: 'pointer',
    border: 'none', fontWeight: 400, transition: 'background .15s',
  };
  const variants = {
    primary: { background: color.blue, color: color.white, boxShadow: shadow.base },
    secondary: { background: color.white, color: color.navyMedium, border: `1px solid ${color.navyMedium}` },
    ghost: { background: 'transparent', color: color.navyMedium },
    danger: { background: color.danger, color: color.white },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
      onMouseUp={(e) => e.currentTarget.style.filter = 'none'}
      onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input({ style, ...rest }) {
  return (
    <input
      style={{
        fontFamily: font.text, fontSize: 16, lineHeight: '24px', minHeight: 44,
        padding: 12, borderRadius: radius.primary, border: `1px solid ${color.border}`,
        color: color.navyDeep, outline: 'none', width: '100%', boxSizing: 'border-box', ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = color.blue; e.currentTarget.style.boxShadow = focusRing; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = color.border; e.currentTarget.style.boxShadow = 'none'; }}
      {...rest}
    />
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: color.white, border: `1px solid ${color.border}`, borderRadius: radius.base,
      padding: space.lg, boxShadow: shadow.subtle, color: color.navyDeep, ...style,
    }}>{children}</div>
  );
}

export function Badge({ kind = 'default', children }) {
  const kinds = {
    default: { background: color.offWhite, color: color.navyDeep, border: `1px solid ${color.lightGray}` },
    success: { background: '#E8F5E9', color: color.success, border: `1px solid ${color.success}` },
    error: { background: color.errorBg, color: color.danger, border: `1px solid ${color.danger}` },
    primary: { background: color.primaryBadgeBg, color: color.blue, border: `1px solid ${color.blue}` },
  };
  return (
    <span style={{
      borderRadius: radius.badge, padding: '4px 8px', fontSize: 12, fontWeight: 500,
      fontFamily: font.text, ...kinds[kind],
    }}>{children}</span>
  );
}

export function Modal({ open, onClose, title, children, width = 500 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(9, 30, 66, 0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: color.white, borderRadius: radius.large, boxShadow: shadow.modal, padding: space.xl, maxWidth: width, width: '90%', maxHeight: '85vh', overflow: 'auto' }}
      >
        {title && (
          <h2 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 500, color: color.navyDeep, borderBottom: `1px solid ${color.lightGray}`, paddingBottom: 16, marginBottom: 16, marginTop: 0 }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}

export function Spinner() {
  return <div style={{ padding: space.lg, color: color.navyLight, fontFamily: font.text }}>Loading…</div>;
}
