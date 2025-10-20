'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if we can use Next.js router
      if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        // Static export mode - use window.location
        console.log('Static mode detected, using direct navigation');
        window.location.href = '#dashboard';
        // Create a simple redirect to dashboard content
        document.body.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <h1>Loading Dashboard...</h1>
            <p>Redirecting to dashboard...</p>
            <script>
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            </script>
          </div>
        `;
      } else {
        // Development mode - use Next.js router
        router.push('/dashboard');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white z-50">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        {/* Ganti dengan logo kamu */}
        <motion.img
          src="/logo-chicha.png"
          alt="Logo"
          className="w-24 h-24 rounded-full bg-white/10 p-2 shadow-lg"
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />
        <motion.h1
          className="text-4xl font-extrabold tracking-wide"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Voucher Tracker
        </motion.h1>
        <motion.p
          className="text-lg opacity-80"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
        >
          Pencatatan Harian Voucher & Saldo E-Wallet
        </motion.p>
        <motion.p
          className="text-lg opacity-80"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          by Alfabyte - 2025
        </motion.p>
      </motion.div>

      {/* Animasi loading di bawah */}
      <motion.div
        className="mt-12 flex gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: { staggerChildren: 0.2 },
          },
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-3 h-3 bg-white rounded-full"
            variants={{
              hidden: { opacity: 0, y: 0 },
              visible: {
                opacity: 1,
                y: [0, -10, 0],
                transition: { repeat: Infinity, duration: 1 },
              },
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
