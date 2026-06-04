'use client';

import { useState } from 'react';
import { IconPlus } from './icons';

const FAQS = [
  { q: 'Is Trello Clone really free to start?', a: 'Yes. The Free plan includes unlimited cards and up to 10 boards per workspace, with no credit card required. Upgrade only when your team needs more.' },
  { q: 'Can I collaborate with my team in real time?', a: 'Absolutely. Invite teammates to any board and see card moves, comments, and edits update live for everyone, no refresh needed.' },
  { q: 'Does it work on mobile?', a: 'Yes. The web app is fully responsive and works in any modern mobile browser, so you can manage your boards on the go.' },
  { q: 'Can I drag and drop cards between lists?', a: 'Drag-and-drop is at the heart of the product. Move cards within a list or across lists with a smooth, natural drag.' },
  { q: 'What does the admin console do?', a: 'On the Business plan, admins manage members, permissions, and workspace settings from a single console with usage visibility.' },
  { q: 'Can I cancel or change plans anytime?', a: 'Yes. Upgrade, downgrade, or cancel at any time. Changes take effect at the start of your next billing cycle.' },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq-wrap">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        return (
          <div className="faq-item" key={item.q}>
            <button
              className="faq-item__btn"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              {item.q}
              <IconPlus className={`faq-item__icon${isOpen ? ' faq-item__icon--open' : ''}`} />
            </button>
            <div
              id={panelId}
              role="region"
              className={`faq-item__panel${isOpen ? ' faq-item__panel--open' : ''}`}
            >
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
