'use client';

import type { ReactNode } from 'react';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSplashScreen = pathname === '/';

  return (
    <html lang="id">
      <body className="antialiased bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
        {!isSplashScreen && (
          <>
            <Sidebar />
            <Navbar />
          </>
        )}
        <div className={isSplashScreen ? '' : 'pl-64 pt-28 min-h-screen'}>
          <main className={isSplashScreen ? '' : 'p-8 bg-white'}>
            {children}
          </main>
        </div>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
