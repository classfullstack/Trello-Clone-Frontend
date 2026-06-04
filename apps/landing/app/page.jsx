import { color, space, radius, font, USER_APP_URL } from './tokens';

const FEATURES = [
  { title: 'Boards', body: 'Give every project a home. See work organized at a glance from to-do to done.' },
  { title: 'Lists & Cards', body: 'Break work into stages and move cards across them with a simple drag.' },
  { title: 'Collaboration', body: 'Invite your team, assign cards, comment, and stay in sync in real time.' },
  { title: 'Due dates', body: 'Add deadlines and never miss what matters with clear, visible dates.' },
  { title: 'Labels & filters', body: 'Color-code and filter cards to find exactly what you need fast.' },
  { title: 'Fast & simple', body: 'No clutter, no learning curve. Open it and get organized in seconds.' },
];

const PLANS = [
  { name: 'Free', price: '$0', tag: 'For individuals', features: ['Unlimited cards', 'Up to 10 boards', 'Mobile + web'] },
  { name: 'Standard', price: '$5', tag: 'Per user / month', features: ['Unlimited boards', 'Advanced checklists', 'Custom fields'], highlight: true },
  { name: 'Premium', price: '$10', tag: 'Per user / month', features: ['Dashboards', 'Timeline view', 'Admin controls'] },
];

function Cta({ children, primary }) {
  return (
    <a
      href={USER_APP_URL}
      style={{
        display: 'inline-block',
        background: primary ? color.blue : color.white,
        color: primary ? color.white : color.navyMedium,
        border: primary ? 'none' : `1px solid ${color.border}`,
        padding: '14px 28px',
        borderRadius: radius.primary,
        fontSize: 17,
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main>
      {/* Nav */}
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${space.base} ${space.xl}`, borderBottom: `1px solid ${color.border}`,
        }}
      >
        <span style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: color.blue }}>
          Trello Clone
        </span>
        <Cta primary>Log in</Cta>
      </header>

      {/* Hero */}
      <section
        style={{
          background: color.navyDeep, color: color.white,
          padding: `${space.max} ${space.xl}`, textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 52, fontWeight: 700, maxWidth: 820, margin: '0 auto' }}>
          Organize anything, together.
        </h1>
        <p style={{ fontSize: 20, color: '#C7D1E0', maxWidth: 620, margin: `${space.lg} auto ${space.xl}` }}>
          Boards, lists, and cards to manage your projects and keep your team in sync — simple, fast, and free to start.
        </p>
        <div style={{ display: 'flex', gap: space.base, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Cta primary>Get started</Cta>
          <a href="#pricing" style={{ alignSelf: 'center', color: '#C7D1E0', fontWeight: 600 }}>See pricing →</a>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: `${space.max} ${space.xl}`, maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, textAlign: 'center', color: color.navyDeep, marginBottom: space.xl }}>
          Everything you need to stay on track
        </h2>
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: space.lg,
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: color.white, border: `1px solid ${color.border}`,
                borderRadius: radius.large, padding: space.lg,
              }}
            >
              <h3 style={{ fontSize: 20, color: color.blue, marginBottom: space.sm }}>{f.title}</h3>
              <p style={{ color: color.navyLight, fontSize: 15 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: color.offWhite, padding: `${space.max} ${space.xl}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center', color: color.navyDeep, marginBottom: space.xl }}>
            Simple pricing
          </h2>
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: space.lg,
            }}
          >
            {PLANS.map((p) => (
              <div
                key={p.name}
                style={{
                  background: color.white,
                  border: p.highlight ? `2px solid ${color.blue}` : `1px solid ${color.border}`,
                  borderRadius: radius.large, padding: space.xl, textAlign: 'center',
                }}
              >
                <h3 style={{ fontSize: 22, color: color.navyDeep }}>{p.name}</h3>
                <div style={{ fontSize: 40, fontWeight: 700, color: color.blue, margin: `${space.sm} 0` }}>{p.price}</div>
                <div style={{ color: color.navyLight, fontSize: 14, marginBottom: space.base }}>{p.tag}</div>
                <ul style={{ listStyle: 'none', textAlign: 'left', display: 'inline-block', color: color.navyMedium, fontSize: 15 }}>
                  {p.features.map((feat) => (
                    <li key={feat} style={{ marginBottom: space.sm }}>✓ {feat}</li>
                  ))}
                </ul>
                <div style={{ marginTop: space.lg }}>
                  <Cta primary={p.highlight}>Choose {p.name}</Cta>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: color.navyDeep, color: color.white, padding: `${space.max} ${space.xl}`, textAlign: 'center' }}>
        <h2 style={{ fontSize: 38, marginBottom: space.base }}>Ready to get organized?</h2>
        <p style={{ color: '#C7D1E0', fontSize: 18, marginBottom: space.xl }}>
          Start free. No credit card required.
        </p>
        <Cta primary>Get started</Cta>
      </section>

      <footer style={{ padding: `${space.lg} ${space.xl}`, textAlign: 'center', color: color.navyLight, fontSize: 14 }}>
        © {new Date().getFullYear()} Trello Clone. Built as a demo.
      </footer>
    </main>
  );
}
