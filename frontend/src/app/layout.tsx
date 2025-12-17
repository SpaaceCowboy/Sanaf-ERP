import type { Metadata } from 'next';
import { QueryProvider } from '@/components/providers/QueryProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ElectroFlow ERP',
  description: 'Enterprise Resource Planning for Electronic Industries',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
