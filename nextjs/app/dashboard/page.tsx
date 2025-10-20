'use client';

import { useEffect, useState } from 'react';
import { statisticsApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DashboardData {
  total_vouchers: number;
  total_voucher_sisa: number;
  total_voucher_terjual: number;
  total_wallet_saldo: number;
  transaksi_hari_ini: {
    voucher: number;
    wallet: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard overview from statistics API (server-side aggregation)
      const resp = await statisticsApi.getDashboard();
  // Normalize payload to accept either { success: true, data: { ... } } or a direct data object
  let payload: Record<string, unknown> | null = null;
      if (!resp) throw new Error('Invalid dashboard response');
      if (resp.success === true && resp.data !== undefined) {
        payload = resp.data;
      } else if (resp.data !== undefined && resp.data.success === true && resp.data.data !== undefined) {
        // handle double-wrapped
        payload = resp.data.data;
      } else if (resp.total_vouchers !== undefined || resp.total_voucher_sisa !== undefined) {
        payload = resp;
      } else if (resp.data !== undefined) {
        payload = resp.data;
      }

  // Debug log to help spot mismatches during runtime
  console.debug('Dashboard payload normalized:', payload);

      if (!payload) throw new Error('Invalid dashboard data');

      const getNum = (obj: Record<string, unknown> | null, key: string) => {
        if (!obj) return 0;
        const v = obj[key];
        if (v === undefined || v === null) return 0;
  const n = Number(String(v));
        return Number.isFinite(n) ? n : 0;
      };

      const transaksi = (payload['transaksi_hari_ini'] as Record<string, unknown> | undefined) || {};

      setData({
        total_vouchers: getNum(payload, 'total_vouchers'),
        total_voucher_sisa: getNum(payload, 'total_voucher_sisa'),
        total_voucher_terjual: getNum(payload, 'total_voucher_terjual'),
        total_wallet_saldo: getNum(payload, 'total_wallet_saldo'),
        transaksi_hari_ini: {
          voucher: getNum(transaksi, 'voucher'),
          wallet: getNum(transaksi, 'wallet')
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Memuat data dashboard...</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Selamat Datang! 👋</h2>
                    <p className="text-indigo-100">Sistem Manajemen Voucher & E-Wallet - Toko Chicha</p>
                  </div>
                  <div className="hidden md:block text-6xl opacity-20">📊</div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Voucher */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-l-4 border-indigo-500 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                      <span className="text-3xl">🎟️</span>
                    </div>
                    <div className="px-2 py-1 bg-indigo-100 rounded-full">
                      <span className="text-xs font-semibold text-indigo-700">Total</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Voucher</h3>
                  <p className="text-3xl font-bold text-indigo-600 mb-2">{formatNumber(data.total_vouchers)}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <span>↑ Semua transaksi</span>
                  </div>
                </div>

                {/* Voucher Sisa */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-l-4 border-green-500 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                      <span className="text-3xl">📦</span>
                    </div>
                    <div className="px-2 py-1 bg-green-100 rounded-full">
                      <span className="text-xs font-semibold text-green-700">Stok</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Voucher Tersedia</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">{formatNumber(data.total_voucher_sisa)}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>✓ Siap dijual</span>
                  </div>
                </div>

                {/* Voucher Terjual */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-l-4 border-pink-500 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-pink-100 rounded-xl group-hover:bg-pink-200 transition-colors">
                      <span className="text-3xl">💳</span>
                    </div>
                    <div className="px-2 py-1 bg-pink-100 rounded-full">
                      <span className="text-xs font-semibold text-pink-700">Sold</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Voucher Terjual</h3>
                  <p className="text-3xl font-bold text-pink-600 mb-2">{formatNumber(data.total_voucher_terjual)}</p>
                  <div className="flex items-center text-xs text-pink-600">
                    <span>📈 Total penjualan</span>
                  </div>
                </div>

                {/* Saldo E-Wallet */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-l-4 border-purple-500 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div className="px-2 py-1 bg-purple-100 rounded-full">
                      <span className="text-xs font-semibold text-purple-700">Wallet</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Saldo E-Wallet</h3>
                  <p className="text-2xl font-bold text-purple-600 mb-2">{formatCurrency(data.total_wallet_saldo)}</p>
                  <div className="flex items-center text-xs text-purple-600">
                    <span>💵 Dana tersedia</span>
                  </div>
                </div>
              </div>

              {/* Activity Today */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">⚡ Aksi Cepat</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <a href="/voucher" className="group p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1">
                      <div className="text-white">
                        <span className="text-3xl mb-2 block">🎟️</span>
                        <p className="font-semibold">Kelola Voucher</p>
                        <p className="text-xs text-indigo-100 mt-1">Tambah & edit data</p>
                      </div>
                    </a>
                    <a href="/wallet" className="group p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1">
                      <div className="text-white">
                        <span className="text-3xl mb-2 block">💰</span>
                        <p className="font-semibold">Kelola Wallet</p>
                        <p className="text-xs text-purple-100 mt-1">Cek saldo & mutasi</p>
                      </div>
                    </a>
                    <a href="/laporan" className="group p-4 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 rounded-xl transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1">
                      <div className="text-white">
                        <span className="text-3xl mb-2 block">📑</span>
                        <p className="font-semibold">Lihat Laporan</p>
                        <p className="text-xs text-pink-100 mt-1">Statistik lengkap</p>
                      </div>
                    </a>
                    <button onClick={fetchDashboardData} className="group p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1">
                      <div className="text-white">
                        <span className="text-3xl mb-2 block">🔄</span>
                        <p className="font-semibold">Refresh Data</p>
                        <p className="text-xs text-green-100 mt-1">Update terbaru</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-96">
              <span className="text-6xl mb-4">😕</span>
              <p className="text-xl text-gray-600 font-semibold">Gagal memuat data dashboard</p>
              <button 
                onClick={fetchDashboardData}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Coba Lagi
            </button>
          </div>
        )}
      </div>
  );
}
