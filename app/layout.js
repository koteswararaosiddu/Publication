import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Publication Extractor',
  description: 'Extract publication records with email addresses from TXT files.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
