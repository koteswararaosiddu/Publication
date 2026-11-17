// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// const items = [
//   { href: '/extract', label: 'Extract', icon: '⇧' },
//   { href: '/history', label: 'History', icon: '◷' }
// ];

// export default function Sidebar() {
//   const pathname = usePathname();

//   return (
//     <aside className="sidebar">
//       <div className="brand">
//         <div className="brand-mark">PE</div>
//         <div>
//           <strong>Publication Extractor</strong>
//           <span>TXT processing</span>
//         </div>
//       </div>

//       <nav className="nav-list" aria-label="Main navigation">
//         {items.map(item => (
//           <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
//             <span className="nav-icon">{item.icon}</span>
//             <span>{item.label}</span>
//           </Link>
//         ))}
//       </nav>

//       <div className="sidebar-footer">
//         <span className="status-dot" /> Local processing
//       </div>
//     </aside>
//   );
// }
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const items = [
  { href: '/extract', label: 'Extract', icon: '⇧' },
  { href: '/history', label: 'History', icon: '◷' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">PE</div>

        {!collapsed && (
          <div className="brand-info">
            <strong>Publication Extractor</strong>
            <span>TXT processing</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="nav-list" aria-label="Main navigation">

        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${
              pathname === item.href ? 'active' : ''
            }`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            {!collapsed && (
              <span className="nav-label">
                {item.label}
              </span>
            )}
          </Link>
        ))}

      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <span className="status-dot" />
          Local processing
        </div>
      )}

      {/* Collapse Arrow */}
      <button
        type="button"
        className="sidebar-collapse-button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={
          collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
        }
      >
        {collapsed ? '›' : '‹'}
      </button>

    </aside>
  );
}
