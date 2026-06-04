import { color, USER_APP_URL } from './tokens';
import Header from './Header';
import Faq from './Faq';
import {
  IconBoard, IconDrag, IconUsers, IconCheck, IconTag, IconShield,
  IconCheckSmall, IconBrand, IconX, IconGithub, IconLinkedin,
} from './icons';

const FEATURES = [
  { icon: IconBoard, bg: color.blue, title: 'Boards & lists', body: 'Give every project a home. See work flow from to-do to done at a single glance.' },
  { icon: IconDrag, bg: color.purple, title: 'Drag & drop', body: 'Move cards across lists with a smooth, natural drag. Reorder work in seconds.' },
  { icon: IconUsers, bg: color.cyan, title: 'Real-time collaboration', body: 'Invite your team and watch moves, comments, and edits update live for everyone.' },
  { icon: IconCheck, bg: color.green, title: 'Checklists', body: 'Break cards into steps and track completion with progress you can actually see.' },
  { icon: IconTag, bg: color.blueDark, title: 'Labels & filters', body: 'Color-code cards and filter instantly to find exactly what you need, fast.' },
  { icon: IconShield, bg: color.navyMedium, title: 'Admin console', body: 'Manage members, permissions, and workspace settings from one secure place.' },
];

const STEPS = [
  { title: 'Create a board', body: 'Spin up a board for any project, sprint, or goal in a couple of clicks.' },
  { title: 'Add lists & cards', body: 'Map your workflow into lists, then capture every task as a card you can move.' },
  { title: 'Collaborate & ship', body: 'Invite your team, assign work, track progress in real time, and get it done.' },
];

const PLANS = [
  { name: 'Free', price: '$0', per: 'forever', tag: 'For individuals getting started', features: ['Up to 10 boards', 'Unlimited cards', 'Drag & drop', 'Mobile + web'], cta: 'Start free' },
  { name: 'Pro', price: '$5', per: '/ user / mo', tag: 'For growing teams', features: ['Unlimited boards', 'Real-time collaboration', 'Checklists & due dates', 'Labels & filters', 'Priority support'], cta: 'Start Pro trial', featured: true },
  { name: 'Business', price: '$10', per: '/ user / mo', tag: 'For organizations', features: ['Everything in Pro', 'Admin console', 'Advanced permissions', 'Usage insights', 'SSO ready'], cta: 'Contact sales' },
];

const TRUST = ['Northwind', 'Acme Co', 'Globex', 'Initech', 'Umbrella', 'Hooli'];

const FOOTER = {
  Product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
};

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        {/* Hero */}
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <span className="eyebrow">Free to start · No credit card</span>
              <h1>Organize anything, together.</h1>
              <p className="hero__sub">
                Boards, lists, and cards to manage your projects and keep your
                team in sync. Simple, fast, and built for the way you work.
              </p>
              <div className="hero__ctas">
                <a href={USER_APP_URL} className="btn btn-primary btn-lg">Get started free</a>
                <a href="#features" className="btn btn-secondary btn-lg">See features</a>
              </div>
              <p className="hero__note">Join 12,000+ teams shipping work faster.</p>
            </div>
            <BoardMock />
          </div>
        </section>

        {/* Trust strip */}
        <section className="trust" aria-label="Trusted by teams">
          <div className="container trust__inner">
            <p className="trust__label">Trusted by fast-moving teams worldwide</p>
            <div className="trust__logos">
              {TRUST.map((t) => (
                <span className="trust__logo" key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="section">
          <div className="container">
            <div className="section-head">
              <h2>Everything you need to stay on track</h2>
              <p>A focused set of features that keep work moving, without the clutter.</p>
            </div>
            <div className="feature-grid">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <article className="feature-card" key={f.title}>
                    <span className="feature-card__icon" style={{ background: f.bg }}>
                      <Icon />
                    </span>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section" style={{ background: color.offWhite }}>
          <div className="container">
            <div className="section-head">
              <h2>Get organized in three steps</h2>
              <p>From blank board to shipped work, faster than your next coffee break.</p>
            </div>
            <div className="steps">
              {STEPS.map((s, i) => (
                <article className="step" key={s.title}>
                  <span className="step__num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section pricing">
          <div className="container">
            <div className="section-head">
              <h2>Simple, transparent pricing</h2>
              <p>Start free and upgrade as your team grows. Cancel anytime.</p>
            </div>
            <div className="price-grid">
              {PLANS.map((p) => (
                <article
                  className={`price-card${p.featured ? ' price-card--featured' : ''}`}
                  key={p.name}
                >
                  {p.featured && <span className="price-card__badge">RECOMMENDED</span>}
                  <h3>{p.name}</h3>
                  <p className="price-card__tag">{p.tag}</p>
                  <div className="price-card__price">
                    {p.price}<span className="price-card__per"> {p.per}</span>
                  </div>
                  <ul className="price-card__list">
                    {p.features.map((feat) => (
                      <li key={feat}><IconCheckSmall /> {feat}</li>
                    ))}
                  </ul>
                  <a
                    href={USER_APP_URL}
                    className={`btn ${p.featured ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {p.cta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section">
          <div className="container">
            <div className="section-head">
              <h2>Frequently asked questions</h2>
              <p>Everything you need to know before you get started.</p>
            </div>
            <Faq />
          </div>
        </section>

        {/* Final CTA */}
        <section className="section">
          <div className="container">
            <div className="cta-banner">
              <h2>Ready to get your team organized?</h2>
              <p>Start free in seconds. No credit card, no setup, no clutter.</p>
              <a href={USER_APP_URL} className="btn btn-on-dark btn-lg">Get started free</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand">
                <span className="brand__mark"><IconBrand /></span>
                Trello Clone
              </span>
              <p>The simple, fast way to organize projects and collaborate with your team.</p>
            </div>
            {Object.entries(FOOTER).map(([heading, links]) => (
              <div className="footer-col" key={heading}>
                <h4>{heading}</h4>
                <ul>
                  {links.map((l) => (
                    <li key={l}><a href="#top">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Trello Clone. Built as a demo.</p>
            <div className="footer-social">
              <a href="#top" aria-label="X (Twitter)"><IconX /></a>
              <a href="#top" aria-label="GitHub"><IconGithub /></a>
              <a href="#top" aria-label="LinkedIn"><IconLinkedin /></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function BoardMock() {
  return (
    <div className="board-mock" aria-hidden="true">
      <div className="board-mock__bar">
        <span className="board-mock__dot" />
        <span className="board-mock__dot" />
        <span className="board-mock__dot" />
        <span className="board-mock__title">Product Roadmap</span>
      </div>
      <div className="board-mock__lists">
        <div className="mock-list">
          <div className="mock-list__head">To do</div>
          <div className="mock-card"><span className="mock-label" style={{ background: color.purple }} />Design landing page</div>
          <div className="mock-card"><span className="mock-label" style={{ background: color.cyan }} />Write release notes</div>
          <div className="mock-card">Plan Q3 sprint</div>
        </div>
        <div className="mock-list">
          <div className="mock-list__head">In progress</div>
          <div className="mock-card mock-card__lift"><span className="mock-label" style={{ background: color.blue }} />Build API endpoints</div>
          <div className="mock-card"><span className="mock-label" style={{ background: color.green }} />User testing</div>
        </div>
        <div className="mock-list">
          <div className="mock-list__head">Done</div>
          <div className="mock-card"><span className="mock-label" style={{ background: color.green }} />Setup CI/CD</div>
          <div className="mock-card"><span className="mock-label" style={{ background: color.blueDark }} />Auth flow</div>
        </div>
      </div>
    </div>
  );
}
