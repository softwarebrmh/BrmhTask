import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'BHRM Teams',
    template: '%s · BHRM Teams',
  },
  description: 'Enterprise Task-Centric Execution Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '10px',
                border: '1px solid rgba(15,23,42,0.08)',
                boxShadow: '0 8px 30px rgba(15,23,42,0.12)',
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#111827',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
