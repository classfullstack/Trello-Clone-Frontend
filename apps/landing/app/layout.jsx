import './globals.css';

const SITE_URL = 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Trello Clone — Organize anything, together',
  description:
    'Boards, lists, and cards to organize your projects and collaborate with your team. A fast, simple Trello clone.',
  keywords: ['trello', 'kanban', 'project management', 'boards', 'collaboration'],
  openGraph: {
    title: 'Trello Clone — Organize anything, together',
    description:
      'Boards, lists, and cards to organize your projects and collaborate with your team.',
    url: SITE_URL,
    siteName: 'Trello Clone',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trello Clone — Organize anything, together',
    description: 'Boards, lists, and cards to organize your projects.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
