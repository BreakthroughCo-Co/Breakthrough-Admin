import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Breakthrough OS - NDIS Practice Management & Clinical Hub',
  description: 'NDIS Practice Management, Operations, Clinical, Compliance, CRM, HR, and Financial Control System for Breakthrough Coaching & Consulting',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-50 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
