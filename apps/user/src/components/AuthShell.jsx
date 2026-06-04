import { color, font, space, shadow, radius } from '@trello/ui';

export function AuthShell({ title, children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${color.navyDeep}, ${color.blue})`,
        padding: space.lg,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: color.white,
          borderRadius: radius.large,
          boxShadow: shadow.modal,
          padding: space.xl,
        }}
      >
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 24,
            fontWeight: 500,
            color: color.navyDeep,
            marginTop: 0,
            marginBottom: space.lg,
          }}
        >
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
