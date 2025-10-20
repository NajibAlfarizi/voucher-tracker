'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/voucher') return 'Manajemen Voucher';
    if (pathname === '/wallet') return 'E-Wallet Management';
    if (pathname === '/laporan') return 'Laporan & Statistik';
    return 'Voucher Tracker';
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-64 right-0 z-40 bg-white shadow-md border-b border-gray-200"
    >
      <div className="flex items-center justify-between px-8 py-4">
        {/* Page Title & Breadcrumb */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang di sistem manajemen voucher dan e-wallet
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Clock & Date */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="text-center">
              {mounted ? (
                <>
                  <div className="text-2xl font-bold text-indigo-600 font-mono">{formattedTime}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{formattedDate}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-indigo-600 font-mono">--:--:--</div>
                  <div className="text-xs text-gray-600 mt-0.5">Loading...</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Running Text Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
        <motion.div
          className="whitespace-nowrap py-2 text-sm font-medium text-white px-4"
          animate={{ x: ['100%', '-100%'] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        >
          🏪Chicha Mobile - Jl. Abdul Muis No. 19, Pasar Baru Padang Panjang | ☎️ 0823-8414-0606 | 
          Jam Operasional: 08:00 - 21:00 WIB | Tersedia: Voucher Telkomsel, Indosat, XL, Tri, Axis, Smartfren | 
          E-Wallet: DANA, OVO, GoPay, ShopeePay | Pembayaran: Cash & Transfer
        </motion.div>
      </div>
    </motion.nav>
  );
}
