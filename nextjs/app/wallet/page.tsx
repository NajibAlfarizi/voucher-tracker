/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrendingUp, FiTrendingDown, FiTrash2, FiX, FiClock, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { masterWalletApi, walletTypeApi, MasterWallet, MasterWalletInput, WalletTransactionType, WalletTransactionInput } from '@/lib/api';
import { dailyWalletApi, WalletDailyStock, WalletDailyStockInput } from '@/lib/api';
import { formatDateTime, formatTimeAgo, getTransactionBadgeColor } from '@/lib/utils';

type TabType = 'wallets' | 'transactions' | 'history' | 'wallet-types';

interface WalletType {
  id: number;
  nama: string;
  nomor_hp?: string;
  aktif: boolean;
  createdAt: string;
}

interface FormModal {
  isOpen: boolean;
  type: 'create-wallet' | 'add-transaction' | 'edit-wallet' | 'add-wallet-type' | null;
  data?: MasterWallet;
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabType | 'wallet-types'>('wallets');
  const [masterWallets, setMasterWallets] = useState<MasterWallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionType[]>([]);
  const [walletTypes, setWalletTypes] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<FormModal>({ isOpen: false, type: null });
  const [editSaldoValue, setEditSaldoValue] = useState<number>(0);
  // State untuk modal input harian wallet
  // Modal type: 'add-saldo', 'input-sisa', 'edit-saldo-awal'
  const [dailyModal, setDailyModal] = useState<{ open: boolean, type?: 'add-saldo' | 'input-sisa' | 'edit-saldo-awal', wallet?: MasterWallet }>({ open: false });
  const [dailyForm, setDailyForm] = useState<WalletDailyStockInput>({
    wallet_id: 0,
    tanggal: new Date().toISOString().split('T')[0],
    sisa: 0,
    masuk: 0,
    keluar: 0,
    catatan: ''
  });
  // State untuk data harian wallet
  const [dailyWallets, setDailyWallets] = useState<WalletDailyStock[]>([]);
  // Range hari yang ditampilkan
  const [daysToShow, setDaysToShow] = useState<number>(7);
  
  // Pagination & Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTipe, setFilterTipe] = useState<'all' | 'masuk' | 'keluar'>('all');
  
  const [walletForm, setWalletForm] = useState({
    nama_wallet: '',
    saldo_awal: 0
  });

  const [transactionForm, setTransactionForm] = useState<WalletTransactionInput>({
    wallet_id: 0,
    tipe: 'masuk',
    jumlah: 0,
    keterangan: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  const [walletTypeForm, setWalletTypeForm] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    fetchMasterWallets();
    fetchTransactions();
    fetchWalletTypes();
    fetchDailyWallets();
  }, []);
  // Fetch data harian wallet
  const fetchDailyWallets = async () => {
    try {
      const response = await dailyWalletApi.getAll();
      // Normalize numeric fields because API may return strings
      const normalized = Array.isArray(response)
        ? (response as unknown[]).map((r) => {
            const item = r as Partial<WalletDailyStock>;
            // normalize date to yyyy-mm-dd to avoid mismatches when comparing
            const rawTanggal = (item.tanggal as string) || '';
            const tanggalOnly = rawTanggal ? new Date(rawTanggal).toISOString().split('T')[0] : '';
            return {
              ...(item as WalletDailyStock),
              id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
              wallet_id: typeof item.wallet_id === 'number' ? item.wallet_id : Number(item.wallet_id) || 0,
              tanggal: tanggalOnly,
              saldo_awal: typeof item.saldo_awal === 'number' ? item.saldo_awal : Number(item.saldo_awal) || 0,
              masuk: typeof item.masuk === 'number' ? item.masuk : Number(item.masuk) || 0,
              keluar: typeof item.keluar === 'number' ? item.keluar : Number(item.keluar) || 0,
              sisa: typeof item.sisa === 'number' ? item.sisa : Number(item.sisa) || 0,
            } as WalletDailyStock;
          })
        : [];
      setDailyWallets(normalized);
    } catch (error) {
      console.error('Error fetching daily wallets:', error);
      setDailyWallets([]);
    }
  };

  const normalizeDate = (d: string) => {
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch (e) {
      return d;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  const fetchWalletTypes = async () => {
    try {
      const response = await walletTypeApi.getAll();
      setWalletTypes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching wallet types:', error);
      setWalletTypes([]);
    }
  };

  const fetchMasterWallets = async () => {
    try {
      setLoading(true);
      const data = await masterWalletApi.getAll();
      setMasterWallets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Gagal memuat data wallet');
      console.error(error);
      setMasterWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Untuk tab riwayat, gunakan scope=history agar tampil semua data
      const params = activeTab === 'history' ? { scope: 'history' } : {};
      const data = await masterWalletApi.getTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Gagal memuat transaksi:', error);
      setTransactions([]);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletForm.nama_wallet.trim()) {
      toast.error('Nama wallet harus diisi');
      return;
    }

    try {
      await masterWalletApi.create(walletForm);
      toast.success('Wallet berhasil ditambahkan');
      setWalletForm({ nama_wallet: '', saldo_awal: 0 });
      setModal({ isOpen: false, type: null });
      fetchMasterWallets();
    } catch (error) {
      toast.error('Gagal menambahkan wallet');
      console.error(error);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterWalletApi.createTransaction(transactionForm);
      toast.success(`Transaksi ${transactionForm.tipe} berhasil dicatat`);
      setTransactionForm({
        wallet_id: 0,
        tipe: 'masuk',
        jumlah: 0,
        keterangan: '',
        tanggal: new Date().toISOString().split('T')[0]
      });
      setModal({ isOpen: false, type: null });
      fetchMasterWallets();
      fetchTransactions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mencatat transaksi';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  // Filter dan sort transaksi
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by tipe
    if (filterTipe !== 'all') {
      filtered = filtered.filter(t => t.tipe === filterTipe);
    }

    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(t => new Date(t.tanggal) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(t => new Date(t.tanggal) <= new Date(filterDateTo));
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return filtered;
  };

  // Pagination
  const getPaginatedTransactions = () => {
    const filtered = getFilteredTransactions();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredTransactions().length / itemsPerPage);

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Yakin ingin menghapus transaksi ini? Saldo akan dikembalikan.')) return;
    
    try {
      await masterWalletApi.deleteTransaction(id);
      toast.success('Transaksi berhasil dihapus');
      fetchMasterWallets();
      fetchTransactions();
    } catch (error) {
      toast.error('Gagal menghapus transaksi');
      console.error(error);
    }
  };

  // Wallet Type CRUD functions
  const handleCreateWalletType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletTypeForm.name.trim()) {
      toast.error('Nama wallet harus diisi');
      return;
    }

    try {
      await walletTypeApi.create({ 
        name: walletTypeForm.name.trim(),
        phone: walletTypeForm.phone.trim() || undefined
      });
      toast.success('Jenis wallet berhasil ditambahkan');
      setWalletTypeForm({ name: '', phone: '' });
      setModal({ isOpen: false, type: null });
      fetchWalletTypes();
    } catch (error) {
      toast.error('Gagal menambahkan jenis wallet');
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Grouping data harian per tanggal
  const groups: Record<string, WalletDailyStock[]> = {};
  dailyWallets.forEach(ds => {
    const dateKey = new Date(ds.tanggal).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(ds);
  });
  const todayKey = new Date().toISOString().split('T')[0];
  const rangeKeys: string[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    rangeKeys.push(d.toISOString().split('T')[0]);
  }
  const allKeysSet = new Set([...Object.keys(groups), ...rangeKeys]);
  const sortedKeys = Array.from(allKeysSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (!groups[todayKey]) groups[todayKey] = [];
  sortedKeys.forEach(k => { if (!groups[k]) groups[k] = []; });

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
                <FiCreditCard className="text-blue-600" />
                Manajemen E-Wallet
              </h1>
              <p className="text-gray-600">Selamat datang di sistem manajemen voucher dan e-wallet</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'wallets'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiCreditCard /> Master Wallet
          </button>
          <button
            onClick={() => setActiveTab('wallet-types')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'wallet-types'
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiPlus /> Jenis Wallet
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiClock /> Riwayat
          </button>
        </div>
        {/* Tab: Jenis Wallet */}
        {activeTab === 'wallet-types' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus className="text-green-600" /> Daftar Jenis Wallet
              </h2>
              <button
                onClick={() => setModal({ isOpen: true, type: 'add-wallet-type' })}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-md flex items-center gap-2"
              >
                <FiPlus /> Tambah Jenis Wallet
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nomor HP</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {walletTypes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Belum ada jenis wallet.</td>
                    </tr>
                  ) : (
                    walletTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{type.nama}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{type.nomor_hp || <span className="text-gray-400">-</span>}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={async () => {
                              if (!window.confirm('Yakin ingin menghapus jenis wallet ini?')) return;
                              try {
                                await walletTypeApi.delete(type.id);
                                toast.success('Jenis wallet berhasil dihapus');
                                await fetchWalletTypes();
                              } catch (err) {
                                toast.error('Gagal menghapus jenis wallet');
                                console.error(err);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            title="Hapus jenis wallet"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tab: Master Wallet (Kanban Harian) */}
        {activeTab === 'wallets' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header range dan filter */}
            <div className="sticky top-36 bg-white z-40 mb-6 shadow-sm">
              <div className="flex items-center justify-between py-4">
                <div className="flex gap-2 overflow-x-auto">
                  {[7, 14, 30].map(range => (
                    <button
                      key={range}
                      onClick={() => setDaysToShow(range)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${daysToShow === range ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    >
                      {range} Hari
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal({ isOpen: true, type: 'create-wallet' })}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    <FiPlus /> Tambah E-Wallet
                  </button>
                  <button
                    onClick={() => setModal({ isOpen: true, type: 'add-wallet-type' })}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    <FiPlus /> Tambah Jenis Wallet
                  </button>
                </div>
              </div>
            </div>

            {/* Kanban board harian wallet */}
            <div className="max-h-[65vh] overflow-y-auto mt-4 no-scrollbar">
              <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto no-scrollbar py-4">
                {sortedKeys.map(dateKey => {
                  const isToday = dateKey === todayKey;
                  return (
                    <div key={dateKey} className={`min-w-[320px] bg-white rounded-2xl shadow-lg border border-purple-100 flex flex-col ${isToday ? 'border-2 border-blue-600' : ''}`}>
                      <div className="px-6 py-4 border-b flex items-center justify-between">
                        <div className="font-bold text-lg text-gray-800">{dateKey}</div>
                        {isToday && <span className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-bold">Hari ini</span>}
                      </div>
                      <div className="flex flex-col gap-3 px-6 py-4">
                        {masterWallets
                          .filter(w => new Date(w.createdAt).toISOString().split('T')[0] <= dateKey)
                          .map(wallet => {
                            const daily = groups[dateKey].find(ds => ds.wallet_id === wallet.id);
                            return (
                              <div key={wallet.id} className={`bg-white p-4 rounded-lg border border-gray-100 shadow-sm ${isToday ? '' : ''}`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="font-semibold text-gray-800">{wallet.nama_wallet}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">Saldo</div>
                                    <div className="font-bold text-green-600 text-lg">{formatCurrency(daily ? daily.sisa : wallet.saldo_saat_ini)}</div>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <div className="px-2 py-1 rounded-md bg-purple-50 text-xs text-purple-700 border">Saldo Awal: <span className="font-semibold ml-1">{formatCurrency(typeof daily?.saldo_awal === 'number' ? daily.saldo_awal : wallet.saldo_saat_ini)}</span></div>
                                  <div className="px-2 py-1 rounded-md bg-green-50 text-xs text-green-700 border">Masuk: <span className="font-semibold ml-1">{formatCurrency(daily?.masuk ?? 0)}</span></div>
                                  <div className="px-2 py-1 rounded-md bg-red-50 text-xs text-red-700 border">Keluar: <span className="font-semibold ml-1">{formatCurrency(typeof daily?.keluar === 'number' ? daily.keluar : 0)}</span></div>
                                  <div className="px-2 py-1 rounded-md bg-blue-50 text-xs text-blue-700 border">Sisa: <span className="font-semibold ml-1">{formatCurrency(daily?.sisa ?? wallet.saldo_saat_ini)}</span></div>
                                </div>

                                <div className="mt-3 flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setDailyForm({
                                        wallet_id: wallet.id,
                                        tanggal: dateKey,
                                        masuk: 0,
                                        keluar: 0,
                                        sisa: wallet.saldo_saat_ini,
                                        catatan: ''
                                      });
                                      setDailyModal({ open: true, type: 'add-saldo', wallet });
                                    }}
                                    className="px-3 py-1 rounded text-sm bg-green-100 text-green-700"
                                  >
                                    + Saldo
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDailyForm({
                                        wallet_id: wallet.id,
                                        tanggal: dateKey,
                                        masuk: 0,
                                        keluar: 0,
                                        sisa: wallet.saldo_saat_ini,
                                        catatan: ''
                                      });
                                      setDailyModal({ open: true, type: 'input-sisa', wallet });
                                    }}
                                    className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700"
                                  >
                                    Sisa
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDailyForm({
                                        wallet_id: wallet.id,
                                        tanggal: dateKey,
                                        masuk: 0,
                                        keluar: 0,
                                        sisa: wallet.saldo_saat_ini,
                                        catatan: ''
                                      });
                                      setDailyModal({ open: true, type: 'edit-saldo-awal', wallet });
                                    }}
                                    className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800"
                                  >
                                    Ubah Saldo Awal
                                  </button>
                                  {/* Hapus data harian wallet button dihapus sesuai permintaan */}
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm('Yakin ingin menghapus wallet ini? Semua data wallet akan dihapus!')) return;
                                      try {
                                        await masterWalletApi.delete(wallet.id);
                                        toast.success('Wallet berhasil dihapus');
                                        await fetchMasterWallets();
                                        await fetchDailyWallets();
                                      } catch (err) {
                                        toast.error('Gagal menghapus wallet');
                                        console.error(err);
                                      }
                                    }}
                                    className="px-3 py-1 rounded text-sm flex items-center gap-1 bg-red-100 text-red-700"
                                    title="Hapus wallet"
                                  >
                                    <FiTrash2 />
                                    Hapus Wallet
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Riwayat */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100"
          >
            <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiClock /> Riwayat Transaksi
              </h2>
            </div>

            {/* Filter Section */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Transaksi</label>
                  <select
                    value={filterTipe}
                    onChange={(e) => {
                      setFilterTipe(e.target.value as 'all' | 'masuk' | 'keluar');
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="masuk">Saldo Masuk</option>
                    <option value="keluar">Saldo Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dari Tanggal</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterTipe('all');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Wallet</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipe</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Jumlah</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredTransactions().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Belum ada transaksi yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    getPaginatedTransactions().map((transaction, index) => {
                    const wallet = masterWallets.find(w => w.id === transaction.wallet_id);
                    return (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div>{formatDateTime(transaction.tanggal)}</div>
                          <div className="text-xs text-gray-500">{formatTimeAgo(transaction.tanggal)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {wallet ? (
                            <div>
                              <div className="font-semibold">{wallet.nama_wallet}</div>
                              <div className="text-xs text-gray-600">E-Wallet</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionBadgeColor(transaction.tipe)}`}>
                            {transaction.tipe === 'masuk' ? '↑ Masuk' : '↓ Keluar'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-bold ${
                          transaction.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.tipe === 'masuk' ? '+' : '-'}{formatCurrency(transaction.jumlah)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {transaction.keterangan || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-600">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredTransactions().length)} dari {getFilteredTransactions().length} transaksi
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Sebelumnya
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Modal: Tambah Wallet */}
        <AnimatePresence>
        {modal.isOpen && modal.type === 'create-wallet' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setModal({ isOpen: false, type: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FiPlus className="text-blue-600" />
                  Tambah E-Wallet
                </h3>
                <button
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <form onSubmit={handleCreateWallet}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Wallet</label>
                    <select
                      value={walletForm.nama_wallet}
                      onChange={(e) => setWalletForm({ ...walletForm, nama_wallet: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Wallet</option>
                      {walletTypes.map((walletType) => (
                        <option key={walletType.id} value={walletType.nama}>
                          {walletType.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Saldo Awal</label>
                    <input
                      type="number"
                      value={walletForm.saldo_awal || ''}
                      onChange={(e) => setWalletForm({ ...walletForm, saldo_awal: Number(e.target.value) || 0 })}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 100000 untuk Rp 100.000</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setModal({ isOpen: false, type: null })}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {modal.isOpen && modal.type === 'edit-wallet' && modal.data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setModal({ isOpen: false, type: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Ubah Saldo Awal</h3>
                <button onClick={() => setModal({ isOpen: false, type: null })} className="text-gray-400 hover:text-gray-600">
                  <FiX />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!modal.data) return;
                const id = modal.data.id;
                try {
                  // Instead of updating master wallet, only upsert today's daily record so only saldo_awal is changed
                  const today = new Date().toISOString().split('T')[0];
                  const targetTanggal = normalizeDate(today);
                  const existingDaily = dailyWallets.find(ds => ds.wallet_id === id && normalizeDate(ds.tanggal) === targetTanggal);
                  if (existingDaily) {
                    const payload: Partial<WalletDailyStockInput> = { saldo_awal: editSaldoValue, catatan: 'Ubah saldo_awal dari master modal' };
                    console.debug('[DBG] edit-wallet(master) - will PUT /api/wallet-daily/:id id=', existingDaily.id, 'payload=', payload);
                    await dailyWalletApi.update(existingDaily.id, payload);
                  } else {
                    const payload = { wallet_id: id, tanggal: targetTanggal, saldo_awal: editSaldoValue, sisa: editSaldoValue, masuk: 0, keluar: 0, catatan: 'Ubah saldo_awal dari master modal' } as WalletDailyStockInput;
                    console.debug('[DBG] edit-wallet(master) - will POST /api/wallet-daily payload=', payload);
                    await dailyWalletApi.create(payload);
                  }
                  toast.success('Saldo awal berhasil diperbarui (harian)');
                  setModal({ isOpen: false, type: null });
                  // refresh daily and master data
                  await fetchDailyWallets();
                  await fetchMasterWallets();
                } catch (err) {
                  console.error('Error updating saldo_awal (daily):', err);
                  toast.error('Gagal memperbarui saldo awal');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet</label>
                    <div className="text-sm text-gray-800 font-medium mb-1">{modal.data?.nama_wallet}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Saldo Awal</label>
                    <input
                      name="saldo_awal"
                      type="number"
                      value={editSaldoValue}
                      onChange={(e) => setEditSaldoValue(Number(e.target.value || 0))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={0}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setModal({ isOpen: false, type: null })} className="flex-1 px-4 py-2 bg-gray-100 rounded text-sm">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded text-sm">Simpan</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {/* Modal: Tambah Saldo, Input Sisa, Ubah Saldo Awal */}
        {dailyModal.open && dailyModal.wallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setDailyModal({ open: false })}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {dailyModal.type === 'add-saldo' && <span>+ Tambah Saldo</span>}
                  {dailyModal.type === 'input-sisa' && <span>Input Sisa</span>}
                  {dailyModal.type === 'edit-saldo-awal' && <span>Ubah Saldo Awal</span>}
                </h3>
                <button onClick={() => setDailyModal({ open: false })} className="text-gray-400 hover:text-gray-600 text-2xl absolute right-6 top-6">
                  <FiX />
                </button>
              </div>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!dailyModal.wallet) return;
                  const walletId = dailyModal.wallet.id;
                  if (dailyModal.type === 'add-saldo') {
                    if (!dailyForm.masuk || dailyForm.masuk <= 0) return;
                    const targetTanggal = normalizeDate(dailyForm.tanggal);
                    const existingDaily = dailyWallets.find(
                      ds => ds.wallet_id === walletId && normalizeDate(ds.tanggal) === targetTanggal
                    );
                    const masukBaru = dailyForm.masuk ?? 0;
                    const saldoAwal = dailyModal.wallet.saldo_saat_ini ?? 0;
                    if (existingDaily) {
                      // Do NOT include saldo_awal when updating for penambahan saldo — avoid changing saldo_awal unintentionally
                      const payload: Partial<WalletDailyStockInput> = {
                        masuk: (existingDaily.masuk ?? 0) + masukBaru,
                        sisa: (existingDaily.sisa ?? 0) + masukBaru,
                        keluar: existingDaily.keluar ?? 0,
                        catatan: dailyForm.catatan || 'Penambahan saldo'
                      };
                      console.debug('[DBG] add-saldo - will PUT /api/wallet-daily/:id id=', existingDaily.id, 'payload=', payload);
                      await dailyWalletApi.update(existingDaily.id, payload);
                    } else {
                      const payload = {
                        wallet_id: walletId,
                        tanggal: targetTanggal,
                        saldo_awal: saldoAwal,
                        masuk: masukBaru,
                        sisa: (dailyForm.sisa ?? 0) + masukBaru,
                        keluar: 0,
                        catatan: dailyForm.catatan || 'Penambahan saldo'
                      } as WalletDailyStockInput;
                      console.debug('[DBG] add-saldo - will POST /api/wallet-daily payload=', payload);
                      await dailyWalletApi.create(payload);
                    }
                  } else if (dailyModal.type === 'input-sisa') {
                    const saldoAwal = dailyModal.wallet.saldo_saat_ini ?? 0;
                    const masuk = dailyForm.masuk ?? 0;
                    const sisa = dailyForm.sisa ?? 0;
                    const keluar = saldoAwal + masuk - sisa;
                    const targetTanggal = normalizeDate(dailyForm.tanggal);
                    const existingDaily = dailyWallets.find(
                      ds => ds.wallet_id === walletId && normalizeDate(ds.tanggal) === targetTanggal
                    );
                    if (existingDaily) {
                      // Perubahan: saat update sisa, jangan sertakan saldo_awal — kirim hanya sisa (dan masuk jika ada)
                      const payload: Partial<WalletDailyStockInput> = {
                        sisa,
                        catatan: dailyForm.catatan || 'Input sisa saldo akhir hari'
                      };
                      if ((dailyForm.masuk ?? 0) > 0) payload.masuk = dailyForm.masuk;
                      console.debug('[DBG] input-sisa - will update daily id=', existingDaily.id, 'payload=', payload);
                      await dailyWalletApi.update(existingDaily.id, payload);
                    } else {
                      const payload = {
                        wallet_id: walletId,
                        tanggal: targetTanggal,
                        saldo_awal: saldoAwal,
                        sisa,
                        keluar: keluar > 0 ? keluar : 0,
                        catatan: dailyForm.catatan || 'Input sisa saldo akhir hari'
                      } as WalletDailyStockInput;
                      console.debug('[DBG] input-sisa - will create daily payload=', payload);
                      await dailyWalletApi.create(payload);
                    }
                  } else if (dailyModal.type === 'edit-saldo-awal') {
                    const targetTanggal = normalizeDate(dailyForm.tanggal);
                    const existingDaily = dailyWallets.find(
                      ds => ds.wallet_id === walletId && normalizeDate(ds.tanggal) === targetTanggal
                    );
                    if (existingDaily) {
                      // Saat user menekan Ubah Saldo Awal: kirim PUT dengan hanya saldo_awal (+masuk opsional) dan catatan
                      const payload: Partial<WalletDailyStockInput> = {
                        saldo_awal: dailyForm.sisa ?? 0,
                        catatan: dailyForm.catatan || 'Ubah saldo awal'
                      };
                      if ((dailyForm.masuk ?? 0) > 0) payload.masuk = dailyForm.masuk;
                      console.debug('[DBG] edit-saldo-awal - will update daily id=', existingDaily.id, 'payload=', payload, 'existingDaily=', existingDaily);
                      const resp = await dailyWalletApi.update(existingDaily.id, payload);
                      console.debug('[DBG] edit-saldo-awal - update response=', resp);
                    } else {
                      const payload = {
                        wallet_id: walletId,
                        tanggal: targetTanggal,
                        saldo_awal: dailyForm.sisa ?? 0,
                        sisa: dailyForm.sisa ?? 0,
                        keluar: 0,
                        catatan: dailyForm.catatan || 'Ubah saldo awal'
                      } as WalletDailyStockInput;
                      console.debug('[DBG] edit-saldo-awal - will create daily payload=', payload);
                      const resp = await dailyWalletApi.create(payload);
                      console.debug('[DBG] edit-saldo-awal - create response=', resp);
                    }
                  }
                  toast.success('Data berhasil diupdate');
                  setDailyModal({ open: false });
                  await fetchMasterWallets();
                  await fetchDailyWallets();
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Wallet</label>
                  <div className="text-base text-gray-800 font-medium mb-2">{dailyModal.wallet?.nama_wallet}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={dailyForm.tanggal}
                    onChange={e => setDailyForm(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                {dailyModal.type === 'add-saldo' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Saldo Masuk</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      pattern="^[1-9][0-9]*$"
                      value={dailyForm.masuk === 0 ? '' : dailyForm.masuk}
                      onChange={e => {
                        const val = e.target.value.replace(/^0+/, '');
                        setDailyForm(f => ({ ...f, masuk: val === '' ? 0 : Number(val) }));
                      }}
                      placeholder="Masukkan nominal"
                      className="w-full px-4 py-2 border border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold text-gray-800"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Tidak boleh 0 atau kosong. Contoh: 100000</p>
                  </div>
                )}
                {dailyModal.type === 'input-sisa' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sisa Saldo Akhir Hari</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={dailyForm.sisa}
                      onChange={e => setDailyForm(f => ({ ...f, sisa: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold text-gray-800"
                      required
                    />
                  </div>
                )}
                {dailyModal.type === 'edit-saldo-awal' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Saldo Awal</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={dailyForm.sisa}
                      onChange={e => setDailyForm(f => ({ ...f, sisa: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-purple-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold text-gray-800"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan</label>
                  <input
                    type="text"
                    value={dailyForm.catatan ?? ''}
                    onChange={e => setDailyForm(f => ({ ...f, catatan: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Opsional"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setDailyModal({ open: false })}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-semibold border border-gray-300 transition-all duration-150 hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold shadow-md transition-all duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                    disabled={dailyModal.type === 'add-saldo' && (!dailyForm.masuk || dailyForm.masuk <= 0)}
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Transaksi */}
      <AnimatePresence>
        {modal.isOpen && modal.type === 'add-transaction' && modal.data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setModal({ isOpen: false, type: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {transactionForm.tipe === 'masuk' ? (
                    <><FiTrendingUp className="text-green-600" /> Saldo Masuk</>
                  ) : (
                    <><FiTrendingDown className="text-red-600" /> Saldo Keluar</>
                  )}
                </h3>
                <button
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Wallet</p>
                <p className="text-xl font-bold text-gray-800">{modal.data.nama_wallet}</p>
                <p className="text-sm text-gray-600 mt-2">Saldo Saat Ini: <span className="font-bold text-green-600">{formatCurrency(modal.data.saldo_saat_ini)}</span></p>
              </div>

              <form onSubmit={handleCreateTransaction}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
                    <input
                      type="number"
                      value={transactionForm.jumlah || ''}
                      onChange={(e) => setTransactionForm({ ...transactionForm, jumlah: Number(e.target.value) || 0 })}
                      min="1"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 50000 untuk Rp 50.000</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
                    <input
                      type="date"
                      value={transactionForm.tanggal}
                      onChange={(e) => setTransactionForm({ ...transactionForm, tanggal: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                    <textarea
                      value={transactionForm.keterangan}
                      onChange={(e) => setTransactionForm({ ...transactionForm, keterangan: e.target.value })}
                      placeholder="Opsional: Catatan transaksi"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setModal({ isOpen: false, type: null })}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                      transactionForm.tipe === 'masuk'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Modal: Tambah Wallet Type */}
        <AnimatePresence>
        {modal.isOpen && modal.type === 'add-wallet-type' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setModal({ isOpen: false, type: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FiPlus className="text-green-600" />
                  Tambah Jenis Wallet
                </h3>
                <button
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <form onSubmit={handleCreateWalletType}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Wallet</label>
                    <input
                      type="text"
                      value={walletTypeForm.name}
                      onChange={(e) => setWalletTypeForm({ ...walletTypeForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Contoh: DANA, OVO, GoPay"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor HP (Opsional)</label>
                    <input
                      type="tel"
                      value={walletTypeForm.phone}
                      onChange={(e) => setWalletTypeForm({ ...walletTypeForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setModal({ isOpen: false, type: null })}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
  );
}
