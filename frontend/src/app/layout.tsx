import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'BHRM Teams',
  description: 'Enterprise Task-Centric Execution Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </QueryProvider>
      </body>
    </html>
  );
}
