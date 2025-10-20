/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiPackage, FiCreditCard, FiTrendingUp, FiTrendingDown, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { masterVoucherApi, masterWalletApi, MasterVoucher, MasterWallet, dailyVoucherApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import * as XLSX from 'xlsx';

type TabType = 'voucher' | 'wallet';

interface VoucherStats {
  total_produk: number;
  total_stok_saat_ini: number;
  total_masuk: number;
  total_keluar: number;
}

interface WalletStats {
  total_wallet: number;
  total_saldo_saat_ini: number;
  total_masuk: number;
  total_keluar: number;
}

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<TabType>('voucher');
  const [loading, setLoading] = useState(true);
  const [voucherStats, setVoucherStats] = useState<VoucherStats | null>(null);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [masterVouchers, setMasterVouchers] = useState<MasterVoucher[]>([]);
  const [masterWallets, setMasterWallets] = useState<MasterWallet[]>([]);

  useEffect(() => { fetchAllData(); }, []);

  async function fetchAllData() {
    try {
      setLoading(true);
      const [vStats, wStats, vouchers, wallets] = await Promise.all([
        masterVoucherApi.getStatistics(),
        masterWalletApi.getStatistics(),
        masterVoucherApi.getAll(),
        masterWalletApi.getAll()
      ]);
      setVoucherStats(vStats);
      setWalletStats(wStats);
      setMasterVouchers(Array.isArray(vouchers) ? vouchers : []);
      setMasterWallets(Array.isArray(wallets) ? wallets : []);
    } catch (err) {
      console.error('fetchAllData error', err);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  }

  const exportToExcel = async () => {
    try {
      if (activeTab === 'voucher') {
        // fetch all daily records and masters
        const [dailyAll, masters] = await Promise.all([dailyVoucherApi.getAll(), masterVoucherApi.getAll()]);
        const dailyRecords = Array.isArray(dailyAll) ? dailyAll : [];

        // Collect unique dates
        const dateSet = new Set<string>();
        dailyRecords.forEach((r: any) => {
          const d = new Date(r.tanggal).toISOString().split('T')[0];
          dateSet.add(d);
        });
        const dates = Array.from(dateSet).sort();

        // build header rows
        const header: (string | number)[] = ['Operator', 'Jenis Paket'];
        dates.forEach(dt => {
          const pretty = formatDate(dt);
          header.push(pretty, '', '', '');
        });
        const subHeader: (string | number)[] = ['', ''];
        dates.forEach(() => subHeader.push('AWAL', 'MASUK', 'KELUAR', 'SISA'));

        const rows: (string | number)[][] = [header, subHeader];

        // map daily by voucher_id and date for quick lookup
        const dailyMap = new Map<number, Record<string, any>>();
        dailyRecords.forEach((r: any) => {
          const vid = r.voucher_id;
          const d = new Date(r.tanggal).toISOString().split('T')[0];
          if (!dailyMap.has(vid)) dailyMap.set(vid, {} as any);
          dailyMap.get(vid)![d] = r;
        });

        // rows per master voucher
        masters.forEach((m: any) => {
          const row: (string | number)[] = [m.operator, m.jenis_paket];
          dates.forEach(dt => {
            const rec = dailyMap.get(m.id)?.[dt];
            if (rec) {
              row.push(rec.stok_awal ?? 0, rec.masuk ?? 0, rec.terjual ?? 0, rec.sisa ?? 0);
            } else {
              row.push('', '', '', '');
            }
          });
          rows.push(row);
        });

        // totals row
        const totals: (string | number)[] = ['TOTAL', ''];
        for (let i = 0; i < dates.length; i++) {
          const col = 2 + i * 4;
          let sumA = 0, sumB = 0, sumC = 0, sumD = 0;
          for (let r = 2; r < rows.length; r++) {
            const row = rows[r];
            sumA += Number(row[col]) || 0;
            sumB += Number(row[col+1]) || 0;
            sumC += Number(row[col+2]) || 0;
            sumD += Number(row[col+3]) || 0;
          }
          totals.push(sumA, sumB, sumC, sumD);
        }
        rows.push([]);
        rows.push(totals);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan_All');
        const filename = `Laporan_All_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
      } else {
        // wallet export unchanged
        let data: Record<string, string | number>[] = masterWallets.map(item => ({
          'Nama Wallet': item.nama_wallet,
          'Saldo Saat Ini': item.saldo_saat_ini
        }));
        if (walletStats) {
          data.push({});
          data.push({ 'Nama Wallet': 'STATISTIK', 'Saldo Saat Ini': '' });
          data.push({ 'Nama Wallet': 'Total Wallet', 'Saldo Saat Ini': walletStats.total_wallet });
          data.push({ 'Nama Wallet': 'Total Saldo', 'Saldo Saat Ini': walletStats.total_saldo_saat_ini });
          data.push({ 'Nama Wallet': 'Total Masuk', 'Saldo Saat Ini': walletStats.total_masuk });
          data.push({ 'Nama Wallet': 'Total Keluar', 'Saldo Saat Ini': walletStats.total_keluar });
        }
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Wallet');
        const filename = 'Laporan_Wallet.xlsx';
        XLSX.writeFile(workbook, filename);
      }
      toast.success('✅ Data berhasil di-export ke Excel!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('❌ Gagal export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <FiBarChart2 className="text-blue-600" />
                Laporan & Statistik
              </h1>
              <p className="text-gray-600">Analisis data voucher dan wallet</p>
            </div>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <FiDownload /> Export Excel
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('voucher')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'voucher'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiPackage /> Laporan Voucher
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiCreditCard /> Laporan Wallet
          </button>
        </div>

        {/* Voucher Tab */}
        {activeTab === 'voucher' && voucherStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Produk</h3>
                  <FiPackage className="text-2xl text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{voucherStats.total_produk}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Stok Saat Ini</h3>
                  <FiPackage className="text-2xl text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{voucherStats.total_stok_saat_ini}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Masuk</h3>
                  <FiTrendingUp className="text-2xl text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">+{voucherStats.total_masuk}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Keluar</h3>
                  <FiTrendingDown className="text-2xl text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">-{voucherStats.total_keluar}</p>
              </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-2xl font-bold text-white">Detail Per Produk</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Operator</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Jenis Paket</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Stok Saat Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {masterVouchers.map((voucher, index) => (
                      <motion.tr
                        key={voucher.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{voucher.operator}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{voucher.jenis_paket}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            voucher.stok_saat_ini > 10 
                              ? 'bg-green-100 text-green-700' 
                              : voucher.stok_saat_ini > 0 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {voucher.stok_saat_ini}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && walletStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Wallet</h3>
                  <FiCreditCard className="text-2xl text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{walletStats.total_wallet}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Saldo</h3>
                  <FiCreditCard className="text-2xl text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(walletStats.total_saldo_saat_ini)}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Masuk</h3>
                  <FiTrendingUp className="text-2xl text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">+{formatCurrency(walletStats.total_masuk)}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Keluar</h3>
                  <FiTrendingDown className="text-2xl text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">-{formatCurrency(walletStats.total_keluar)}</p>
              </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-2xl font-bold text-white">Detail Per Wallet</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Wallet</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Saldo Saat Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {masterWallets.map((wallet, index) => (
                      <motion.tr
                        key={wallet.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{wallet.nama_wallet}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            wallet.saldo_saat_ini > 100000 
                              ? 'bg-green-100 text-green-700' 
                              : wallet.saldo_saat_ini > 0 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {formatCurrency(wallet.saldo_saat_ini)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
    </div>
  );
}
