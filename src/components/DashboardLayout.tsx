'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
  };
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/inbox', label: 'Inbox', icon: '📥' },
    { href: '/contacts', label: 'Contacts', icon: '👥' },
    ...(user.role === 'admin' ? [{ href: '/users', label: 'Users', icon: '⚙️' }] : []),
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>BuWa CRM</h1>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>
            {user.name}
          </div>
          <Link href="/logout" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Sign out
          </Link>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
