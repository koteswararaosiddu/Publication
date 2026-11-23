
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'minty publishers Extractor',
  description:
    'Extract publication records with email addresses from TXT files.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
