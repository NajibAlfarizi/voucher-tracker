'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Sidebar() {
  const pathname = usePathname();
  
  const menu = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', badge: null },
    { name: 'Voucher', href: '/voucher', icon: '🎟️', badge: null },
    { name: 'E-Wallet', href: '/wallet', icon: '💰', badge: null },
    { name: 'Laporan', href: '/laporan', icon: '📑', badge: null },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex flex-col z-40 border-r border-slate-700/50">
      {/* Logo & Brand */}
      <div className="h-20 flex items-center px-6 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎟️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Voucher Tracker
            </h1>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-2">
          {menu.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all relative group
                ${isActive(item.href) 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50' 
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              {/* Active Indicator */}
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
              
              <span className="text-2xl">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              
              {/* Badge */}
              {item.badge && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                  {item.badge}
                </span>
              )}
              
              {/* Hover Arrow */}
              {!isActive(item.href) && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">→</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
        
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">© 2025 Voucher Tracker</p>
          <p className="text-xs text-slate-600 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
