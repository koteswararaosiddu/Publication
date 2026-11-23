
'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/verify-otp';

  if (isAuthPage) {
    return (
      <div className="auth-shell">
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
