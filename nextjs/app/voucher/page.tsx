 'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiPlus, FiTrash2, FiX, FiShoppingCart, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { masterVoucherApi, operatorApi, dailyVoucherApi, MasterVoucher, VoucherDailyStock, VoucherDailyStockInput } from '@/lib/api';
import { formatDateTime, formatDate } from '@/lib/utils';

type TabType = 'products' | 'transactions' | 'history';
type ProviderType = 'all' | number;

interface Operator {
  id: number;
  nama: string;
  kode: string;
  aktif: boolean;
  createdAt: string;
}

interface FormModal {
  isOpen: boolean;
  type: 'create-product' | 'add-transaction' | 'edit-product' | 'add-operator' | null;
  data?: MasterVoucher;
}

export default function VoucherPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [activeProvider, setActiveProvider] = useState<ProviderType>('all');
  const [masterVouchers, setMasterVouchers] = useState<MasterVoucher[]>([]);
  const [dailyStocks, setDailyStocks] = useState<VoucherDailyStock[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<FormModal>({ isOpen: false, type: null });
  // Tambahan state untuk modal aksi terpisah
  const [stockModal, setStockModal] = useState<{ open: boolean, data?: MasterVoucher }>({ open: false });
  const [sisaModal, setSisaModal] = useState<{ open: boolean, data?: MasterVoucher }>({ open: false });
  const [modalTargetTanggal, setModalTargetTanggal] = useState<string | null>(null);
  // keep as string to avoid forcing numeric coercion while typing (prevents leading-zero issues)
  const [tambahStok, setTambahStok] = useState('');
  const [inputSisa, setInputSisa] = useState(0);
  // tick used to re-evaluate 'today' and optionally refresh data when the day changes
  const prevDayRef = useRef<string | null>(null);
  
  // Pagination & Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  // how many days to show in the Kanban (including today)
  const [daysToShow, setDaysToShow] = useState<number>(7);
  
  const [productForm, setProductForm] = useState({
    operator: '',
    jenis_paket: '',
    stok_awal: 0
  });

  // State untuk input harian
  const [dailyForm, setDailyForm] = useState<VoucherDailyStockInput>({
    voucher_id: 0,
    tanggal: new Date().toISOString().split('T')[0],
    sisa: 0,
    masuk: 0,
    catatan: ''
  });

  const [operatorForm, setOperatorForm] = useState({
    name: ''
  });

  // Track which past-date cards have been temporarily activated for editing
  const [activatedCards, setActivatedCards] = useState<Record<string, boolean>>({});
  // Temporarily hide cards that the user deleted (optimistic UI)
  const [hiddenCards, setHiddenCards] = useState<Record<string, boolean>>({});

  // Confirmation modal state (reusable)
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm?: (() => Promise<void>) | null;
  }>({ open: false, title: undefined, message: undefined, confirmLabel: 'Hapus', cancelLabel: 'Batal', loading: false, onConfirm: null });

  const closeConfirm = () => setConfirmState({ open: false, title: undefined, message: undefined, confirmLabel: 'Hapus', cancelLabel: 'Batal', loading: false, onConfirm: null });

  const showConfirm = (opts: { title?: string; message?: string; confirmLabel?: string; cancelLabel?: string; onConfirm?: () => Promise<void> }) => {
    setConfirmState({ open: true, title: opts.title, message: opts.message, confirmLabel: opts.confirmLabel || 'Hapus', cancelLabel: opts.cancelLabel || 'Batal', loading: false, onConfirm: opts.onConfirm || null });
  };

  const getCardKey = (dateKey: string, voucherId: number) => `${dateKey}::${voucherId}`;

  const toggleActivateCard = (key: string, value?: boolean) => {
    setActivatedCards(prev => ({ ...prev, [key]: typeof value === 'boolean' ? value : !prev[key] }));
  };

  useEffect(() => {
    fetchMasterVouchers();
    fetchDailyStocks();
    fetchOperators();
  }, []);

  // helper to set provider by id (more robust) and ensure Master Produk tab is active
  const handleSetProviderById = (id?: number) => {
    if (typeof id === 'number') {
      setActiveProvider(id);
    } else {
      setActiveProvider('all');
    }
    setActiveTab('products');
  };

  // Resolve active provider name (used for filtering vouchers)
  const getActiveProviderName = () => {
    if (activeProvider === 'all') return 'all';
    const op = operators.find(o => o.id === activeProvider);
    return op ? (op.nama || '').toString().trim() : 'all';
  };

  // schedule a precise refresh at the next WIB midnight
  useEffect(() => {
    const tz = 7 * 60 * 60 * 1000;
    // initialize prev day
    prevDayRef.current = new Date(Date.now() + tz).toISOString().split('T')[0];

    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const now = Date.now();
      const todayWIBStr = new Date(now + tz).toISOString().split('T')[0];
      // WIB midnight of today in UTC ms
      const todayMidnightWIBUtc = Date.parse(`${todayWIBStr}T00:00:00.000Z`) - tz;
      // choose the next upcoming WIB midnight (could be today or tomorrow)
      let target = todayMidnightWIBUtc;
      if (target <= now) target += 24 * 60 * 60 * 1000;
      const msUntil = target - now;

      timer = setTimeout(async () => {
        try {
          await fetchDailyStocks();
          await fetchMasterVouchers();
          // update prevDayRef to the new day
          prevDayRef.current = new Date(Date.now() + tz).toISOString().split('T')[0];
        } catch (err) {
          console.error('Error refreshing at midnight:', err);
        }
        // schedule again for next midnight
        scheduleNext();
      }, msUntil);
    };

    scheduleNext();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  const fetchDailyStocks = async () => {
    try {
      const response = await dailyVoucherApi.getAll();
      setDailyStocks(Array.isArray(response) ? response : []);
      // clear any optimistic hides when we get fresh data from server
      setHiddenCards({});
    } catch (error) {
      console.error('Error fetching daily stocks:', error);
      setDailyStocks([]);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await operatorApi.getAll();
      setOperators(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      setOperators([]);
    }
  };

  const fetchMasterVouchers = async () => {
    try {
      setLoading(true);
      const response = await masterVoucherApi.getAll();
      console.log('Response dari API:', response);
      
      // Handle different response formats
      let data = response;
      if (response?.data) {
        data = response.data;
      }
      if (response?.success && response?.data) {
        data = response.data;
      }
      
      console.log('Data setelah parsing:', data);
      setMasterVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Gagal memuat data voucher');
      console.error('Error detail:', error);
      setMasterVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil data harian terbaru per voucher
  const getLatestDailyStock = (voucherId: number) => {
    const stocks = dailyStocks.filter(ds => ds.voucher_id === voucherId);
    if (stocks.length === 0) return null;
    return stocks.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];
  };

  // Fungsi untuk menghitung total terjual hari ini (dari data harian terbaru)
  const getTotalTerjual = (voucherId: number) => {
    const latest = getLatestDailyStock(voucherId);
    return latest ? latest.terjual : 0;
  };

  // Helpers untuk tabel riwayat daily stock
  const getFilteredDailyStocks = () => {
    let filtered = [...dailyStocks];
    if (filterDateFrom) {
      filtered = filtered.filter(ds => new Date(ds.tanggal) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(ds => new Date(ds.tanggal) <= new Date(filterDateTo));
    }
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    return filtered;
  };

  const getPaginatedDailyStocks = () => {
    const filtered = getFilteredDailyStocks();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredDailyStocks().length / itemsPerPage);

  const handleDeleteDailyStock = async (id: number) => {
    // show modal confirmation instead
    showConfirm({
      title: 'Hapus catatan harian',
      message: 'Yakin ingin menghapus data harian ini?',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, loading: true }));
        try {
          await dailyVoucherApi.delete(id);
          toast.success('Data harian berhasil dihapus');
          await fetchDailyStocks();
          await fetchMasterVouchers();
        } catch (error) {
          toast.error('Gagal menghapus data harian');
          console.error(error);
        } finally {
          setConfirmState(s => ({ ...s, loading: false }));
          closeConfirm();
        }
      }
    });
  };

  // Delete the master voucher (product) and all related records. This removes the product completely.
  const handleDeleteCardByVoucherDate = async (voucherId: number) => {
    showConfirm({
      title: 'Hapus produk',
      message: 'Yakin ingin menghapus produk ini beserta semua catatan dan transaksi terkait?',
      confirmLabel: 'Hapus produk',
      cancelLabel: 'Batal',
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, loading: true }));
        try {
          // optimistic: remove product locally so it disappears from all date columns
          setMasterVouchers(prev => prev.filter(m => m.id !== voucherId));
          setDailyStocks(prev => prev.filter(ds => ds.voucher_id !== voucherId));

          await masterVoucherApi.delete(voucherId);

          toast.success('Produk berhasil dihapus');
          await fetchMasterVouchers();
          await fetchDailyStocks();
        } catch (error) {
          toast.error('Gagal menghapus produk');
          console.error('Error deleting master voucher:', error);
          await fetchMasterVouchers();
          await fetchDailyStocks();
        } finally {
          setConfirmState(s => ({ ...s, loading: false }));
          closeConfirm();
        }
      }
    });
  };



  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterVoucherApi.create(productForm);
      toast.success('Produk voucher berhasil ditambahkan');
      setProductForm({ operator: '', jenis_paket: '', stok_awal: 0 });
      setModal({ isOpen: false, type: null });
      fetchMasterVouchers();
    } catch (error) {
      toast.error('Gagal menambahkan produk voucher');
      console.error(error);
    }
  };



  // Operator CRUD functions
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorForm.name.trim()) {
      toast.error('Nama operator harus diisi');
      return;
    }

    try {
      await operatorApi.create({ name: operatorForm.name.trim() });
      toast.success('Operator berhasil ditambahkan');
      setOperatorForm({ name: '' });
      setModal({ isOpen: false, type: null });
      fetchOperators();
    } catch (error) {
      toast.error('Gagal menambahkan operator');
      console.error(error);
    }
  };

  const handleDeleteOperator = async (id: number) => {
    showConfirm({
      title: 'Hapus operator',
      message: 'Yakin ingin menghapus operator ini?',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, loading: true }));
        try {
          await operatorApi.delete(id);
          toast.success('Operator berhasil dihapus');
          await fetchOperators();
        } catch (error) {
          toast.error('Gagal menghapus operator');
          console.error(error);
        } finally {
          setConfirmState(s => ({ ...s, loading: false }));
          closeConfirm();
        }
      }
    });
  };

  // Handler untuk buka modal tambah stok
  const handleOpenTambahStok = (voucher: MasterVoucher, tanggal?: string) => {
    setTambahStok('');
    setStockModal({ open: true, data: voucher });
    setModalTargetTanggal(tanggal || null);
  };
  // Handler untuk buka modal input sisa
  const handleOpenInputSisa = (voucher: MasterVoucher, tanggal?: string) => {
    setInputSisa(voucher.stok_saat_ini);
    setSisaModal({ open: true, data: voucher });
    setModalTargetTanggal(tanggal || null);
  };

  // Build a timestamp for a date (dateOnly "YYYY-MM-DD") using current time's time portion (ISO)
  const buildTimestampForDate = (dateOnly: string) => {
    // current time ISO part (HH:MM:SS.sssZ)
    const timePart = new Date().toISOString().split('T')[1];
    return `${dateOnly}T${timePart}`;
  };

  // Prepare Kanban groups & date range (moved out of JSX to avoid nested IIFE parsing issues)
  const groups: Record<string, VoucherDailyStock[]> = {};
  dailyStocks.forEach(ds => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hide inner scrollbars for Kanban to avoid pale blue track showing; keep scrolling functional */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <FiPackage className="text-blue-600" />
                Manajemen Voucher
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
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiPackage /> Master Produk
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiShoppingCart /> Catat Transaksi
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

        {/* Tab: Master Produk (Kanban view grouped by date) */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Sticky filter/header area */}
            <div className="sticky top-36 bg-white z-40 mb-6 shadow-sm">
              <div className="flex items-center justify-between py-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleSetProviderById(undefined)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeProvider === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Semua
                </button>
                {operators.map((operator) => (
                  <button
                    key={operator.id}
                    onClick={() => handleSetProviderById(operator.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      activeProvider === operator.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {operator.nama}
                  </button>
                ))}
                <button
                  onClick={() => setModal({ isOpen: true, type: 'add-operator' })}
                  className="px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                >
                  <FiPlus size={14} /> Operator
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 mr-2">Tampilkan:</div>
                {[7,14,30].map(d => (
                  <button
                    key={d}
                    onClick={() => setDaysToShow(d)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${daysToShow === d ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >{d} hari</button>
                ))}
              </div>

              <button
                onClick={() => setModal({ isOpen: true, type: 'create-product' })}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
              >
                <FiPlus /> Tambah Produk
              </button>
              </div>
            </div>

            {/* Kanban board: fixed height with vertical scroll */}
            <div className="max-h-[65vh] overflow-y-auto mt-4 no-scrollbar">
              <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto py-4 no-scrollbar">
              {sortedKeys.length === 0 ? (
                <div className="min-w-[300px] bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
                  <div className="text-gray-600">Belum ada data harian. Tambah produk atau input stok untuk membuat kartu.</div>
                </div>
              ) : (
                sortedKeys.map(dateKey => {
                  const isTodayColumn = dateKey === todayKey;
                  return (
                    <div key={dateKey} className={`min-w-[320px] ${isTodayColumn ? 'bg-white border-2 border-blue-200 shadow-md' : 'bg-white rounded-2xl shadow-lg'} p-4` }>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-bold text-gray-500">{formatDate(dateKey)}</div>
                        {isTodayColumn && <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Hari ini</div>}
                      </div>
                      <div className="space-y-3">
                        {masterVouchers
                          .filter(v => {
                            const activeProviderName = getActiveProviderName();
                            if (activeProviderName !== 'all' && v.operator !== activeProviderName) return false;
                            if (!v.createdAt) return true;
                            const createdDate = new Date(v.createdAt).toISOString().split('T')[0];
                            return createdDate <= dateKey;
                          })
                          .map(voucher => {
                            const records = groups[dateKey].filter(r => r.voucher_id === voucher.id);
                            const earliest = records.length ? records.slice().sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())[0] : null;
                            const latest = records.length ? records.slice().sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0] : null;
                            const stok_awal = earliest ? earliest.stok_awal : voucher.stok_saat_ini;
                            const masukSum = records.reduce((s, r) => s + (r.masuk || 0), 0);
                            const sisa = latest ? latest.sisa : voucher.stok_saat_ini;
                            const terjual = stok_awal + masukSum - sisa;
                            const todayKeyForCompare = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
                            const isPast = dateKey < todayKeyForCompare;
                            const cardKey = getCardKey(dateKey, voucher.id);
                            const isActivated = !!activatedCards[cardKey];
                            const remainingRecordsForCard = groups[dateKey].filter(r => r.voucher_id === voucher.id);
                            if (hiddenCards[cardKey] && remainingRecordsForCard.length === 0) return null;
                            const effectiveDisabled = isPast && !isActivated;
                            return (
                              <div key={voucher.id} className={`bg-white p-4 rounded-lg border border-gray-100 shadow-sm ${effectiveDisabled ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="font-semibold text-gray-800">{voucher.jenis_paket}</div>
                                    <div className="text-sm text-gray-600">{voucher.operator}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">Terjual</div>
                                    <div className="font-bold text-purple-600 text-lg">{terjual}</div>
                                  </div>
                                </div>

                                {isActivated && (
                                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">Mode edit: mengubah data untuk {formatDate(dateKey)}</div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <div className="px-2 py-1 rounded-md bg-gray-50 text-xs text-gray-700 border">Stok Awal: <span className="font-semibold ml-1">{stok_awal}</span></div>
                                  <div className="px-2 py-1 rounded-md bg-green-50 text-xs text-green-700 border">Masuk: <span className="font-semibold ml-1">{masukSum}</span></div>
                                  <div className="px-2 py-1 rounded-md bg-blue-50 text-xs text-blue-700 border">Sisa: <span className="font-semibold ml-1">{sisa}</span></div>
                                  <div className="px-2 py-1 rounded-md bg-purple-50 text-xs text-purple-700 border">Terjual: <span className="font-semibold ml-1">{terjual}</span></div>
                                </div>

                                <div className="mt-3 flex items-center justify-end gap-2">
                                  {isPast ? (
                                    isActivated ? (
                                      <>
                                        <button onClick={() => toggleActivateCard(cardKey, false)} className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">Selesai</button>
                                        <button onClick={() => handleOpenTambahStok(voucher, dateKey)} disabled={effectiveDisabled} className={`px-3 py-1 rounded text-sm ${effectiveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700'}`}>+ Stok</button>
                                        <button onClick={() => handleOpenInputSisa(voucher, dateKey)} disabled={effectiveDisabled} className={`px-3 py-1 rounded text-sm ${effectiveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700'}`}>Sisa</button>
                                      </>
                                    ) : (
                                      <button onClick={() => toggleActivateCard(cardKey, true)} className="px-3 py-1 rounded text-sm bg-indigo-100 text-indigo-700">Aktifkan</button>
                                    )
                                  ) : (
                                    <>
                                      <button onClick={() => handleOpenTambahStok(voucher, dateKey)} className="px-3 py-1 rounded text-sm bg-green-100 text-green-700">+ Stok</button>
                                      <button onClick={() => handleOpenInputSisa(voucher, dateKey)} className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700">Sisa</button>
                                      <button
                                        onClick={() => setModal({ isOpen: true, type: 'edit-product', data: voucher })}
                                        disabled={effectiveDisabled}
                                        className={`px-3 py-1 rounded text-sm ${effectiveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-yellow-100 text-yellow-800'}`}
                                        title="Ubah stok awal produk"
                                      >
                                        Ubah Stok Awal
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCardByVoucherDate(voucher.id)}
                                        disabled={effectiveDisabled}
                                        className={`px-3 py-1 rounded text-sm ${effectiveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-700'}`}
                                        title="Hapus semua catatan hari ini untuk produk ini"
                                      >
                                        <FiTrash2 />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                          .filter(Boolean)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Catat Transaksi */}
        {activeTab === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiShoppingCart className="text-blue-600" />
              Catat Transaksi Voucher
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterVouchers.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">Belum ada produk voucher.</p>
                </div>
              ) : (
                masterVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{voucher.operator}</h4>
                      <p className="text-sm text-gray-600">{voucher.jenis_paket}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Stok</p>
                      <p className="text-2xl font-bold text-blue-600">{voucher.stok_saat_ini}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* <button
                      onClick={() => handleOpenDailyModal(voucher)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm flex items-center justify-center gap-1"
                    >
                      <FiClock /> Input Harian
                    </button> */}
                  </div>
                </div>
              ))
              )}
            </div>

            {/* Daftar Operator */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Operator Terdaftar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {operators.map((operator) => (
                  <div
                    key={operator.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <span className="font-medium text-gray-700 text-sm">{operator.nama}</span>
                    <button
                      onClick={() => handleDeleteOperator(operator.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                      title="Hapus operator"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
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
                <FiClock /> Riwayat Stok Harian
              </h2>
            </div>

            {/* Filter Section */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Produk</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Catatan</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredDailyStocks().length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        Belum ada data harian yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    getPaginatedDailyStocks().map((ds: VoucherDailyStock, index: number) => {
                    const voucher = masterVouchers.find(v => v.id === ds.voucher_id);
                    return (
                      <motion.tr
                        key={ds.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div>{formatDateTime(ds.updatedAt || ds.createdAt || ds.tanggal)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {voucher ? (
                            <div>
                              <div className="font-semibold">{voucher.operator}</div>
                              <div className="text-xs text-gray-600">{voucher.jenis_paket}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{ds.catatan || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteDailyStock(ds.id)}
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
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredDailyStocks().length)} dari {getFilteredDailyStocks().length} data harian
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

        {/* Modal: Tambah Produk */}
        <AnimatePresence>
          {modal.isOpen && modal.type === 'create-product' && (
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
                  Tambah Produk Voucher
                </h3>
                <button
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Operator</label>
                    <select
                      value={productForm.operator}
                      onChange={(e) => setProductForm({ ...productForm, operator: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Operator</option>
                      {operators.map((operator) => (
                        <option key={operator.id} value={operator.nama}>
                          {operator.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Paket</label>
                    <input
                      type="text"
                      value={productForm.jenis_paket}
                      onChange={(e) => setProductForm({ ...productForm, jenis_paket: e.target.value })}
                      placeholder="Contoh: 2GB, 5GB, Unlimited"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stok Awal</label>
                    <input
                      type="number"
                      value={productForm.stok_awal || ''}
                      onChange={(e) => setProductForm({ ...productForm, stok_awal: Number(e.target.value) || 0 })}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {modal.isOpen && modal.type === 'edit-product' && modal.data && (
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
                <h3 className="text-lg font-bold text-blue-600">Ubah Stok Awal</h3>
                <button onClick={() => setModal({ isOpen: false, type: null })} className="text-purple-400 hover:text-purple-600">
                  <FiX />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!modal.data) return;
                const id = modal.data.id;
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('stok_awal') as HTMLInputElement;
                const value = Number(input.value || 0);
                try {
                  // call API: include both stok_awal and stok_saat_ini so backend records both intentions
                  await masterVoucherApi.update(id, { stok_awal: value, stok_saat_ini: value });
                  // optimistic UI: update local state immediately so UI reflects change
                  setMasterVouchers(prev => prev.map(m => m.id === id ? { ...m, stok_saat_ini: value } : m));
                  toast.success('Stok awal berhasil diperbarui');
                  setModal({ isOpen: false, type: null });
                  // still refetch to ensure server canonical state
                  await fetchMasterVouchers();
                  await fetchDailyStocks();
                } catch (err) {
                  console.error('Error updating stok_awal:', err);
                  toast.error('Gagal memperbarui stok awal');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Produk</label>
                    <div className="text-sm text-gray-800 font-medium mb-1">{modal.data?.operator} - {modal.data?.jenis_paket}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stok Awal</label>
                    <input
                      name="stok_awal"
                      type="number"
                      defaultValue={modal.data?.stok_saat_ini ?? 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={0}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setModal({ isOpen: false, type: null })} className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded text-sm hover:bg-gray-50">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded text-sm">Simpan</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
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
                  <FiClock className="text-blue-600" /> Input Stok Harian
                </h3>
                <button
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Produk</p>
                <p className="text-xl font-bold text-gray-800">{modal.data.operator} - {modal.data.jenis_paket}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Stok Saat Ini:</span>
                    <span className="font-bold text-blue-600 ml-1">{modal.data.stok_saat_ini}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Terjual Hari Ini:</span>
                    <span className="font-bold text-green-600 ml-1">{getTotalTerjual(modal.data.id)}</span>
                  </div>
                </div>
                
                {/* Preview Calculation */}
                {(dailyForm.sisa !== modal.data.stok_saat_ini || ((dailyForm.masuk || 0) > 0)) && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2">Preview Perhitungan:</p>
                    <div className="text-xs space-y-1">
                      <div>Stok Awal: <span className="font-bold">{modal.data.stok_saat_ini}</span></div>
                      {(dailyForm.masuk || 0) > 0 && (
                        <div className="text-green-600">+ Stok Masuk: <span className="font-bold">{dailyForm.masuk || 0}</span></div>
                      )}
                      <div>Stok Akhir: <span className="font-bold">{dailyForm.sisa}</span></div>
                      <div className="border-t pt-1">
                        <span className="text-blue-600">Terjual: <span className="font-bold">{Math.max(0, modal.data.stok_saat_ini + (dailyForm.masuk || 0) - dailyForm.sisa)}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dailyVoucherApi.create(dailyForm);
                  toast.success('Input harian berhasil disimpan');
                  setModal({ isOpen: false, type: null });
                  fetchMasterVouchers();
                  fetchDailyStocks();
                } catch (error) {
                  toast.error('Gagal input harian');
                  console.error(error);
                }
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Input</label>
                    <input
                      type="date"
                      value={dailyForm.tanggal}
                      onChange={(e) => setDailyForm({ ...dailyForm, tanggal: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  {/* Stok Tambahan Section */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <label className="flex items-center text-sm font-semibold text-green-700 mb-2">
                      <FiPlus className="mr-2" /> Penambahan Stok (Opsional)
                    </label>
                    <input
                      type="number"
                      value={dailyForm.masuk || 0}
                      onChange={(e) => setDailyForm({ ...dailyForm, masuk: Number(e.target.value) })}
                      min="0"
                      placeholder="Masukkan jumlah stok baru yang ditambahkan"
                      className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    />
                    <p className="text-xs text-green-600 mt-1">Contoh: Ada penambahan stok baru sebanyak 50 unit</p>
                  </div>

                  {/* Stok Akhir Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="flex items-center text-sm font-semibold text-blue-700 mb-2">
                      <FiPackage className="mr-2" /> Stok Akhir Hari Ini *
                    </label>
                    <input
                      type="number"
                      value={dailyForm.sisa}
                      onChange={(e) => setDailyForm({ ...dailyForm, sisa: Number(e.target.value) })}
                      min="0"
                      placeholder="Berapa stok yang tersisa di akhir hari?"
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    />
                    <p className="text-xs text-blue-600 mt-1">Stok tersisa setelah penjualan hari ini (wajib diisi)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Harian</label>
                    <textarea
                      value={dailyForm.catatan || ''}
                      onChange={(e) => setDailyForm({ ...dailyForm, catatan: e.target.value })}
                      placeholder="Contoh: Hari ini ramai, banyak yang beli paket data..."
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Operator */}
      <AnimatePresence>
        {modal.isOpen && modal.type === 'add-operator' && (
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
                  <FiPackage className="text-blue-600" /> Tambah Operator
                </h3>
                <button
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateOperator}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Operator</label>
                    <input
                      type="text"
                      value={operatorForm.name}
                      onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contoh: Three, By.U, etc."
                      required
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
                    Tambah Operator
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal (reusable) */}
      {confirmState.open && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { if (!confirmState.loading) closeConfirm(); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{confirmState.title || 'Konfirmasi'}</h3>
              <button onClick={() => { if (!confirmState.loading) closeConfirm(); }} className="text-gray-400 hover:text-gray-600" disabled={confirmState.loading}>
                <FiX size={20} />
              </button>
            </div>
            <div className="mb-4 text-sm text-gray-700">{confirmState.message}</div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { if (!confirmState.loading) closeConfirm(); }} className="px-4 py-2 rounded bg-gray-100 text-gray-700" disabled={confirmState.loading}>{confirmState.cancelLabel}</button>
              <button
                onClick={async () => { if (confirmState.onConfirm) { await confirmState.onConfirm(); } }}
                className={`px-4 py-2 rounded ${confirmState.loading ? 'bg-gray-300 text-gray-600' : 'bg-red-600 text-white'}`}
                disabled={confirmState.loading}
              >
                {confirmState.loading ? 'Memproses...' : (confirmState.confirmLabel || 'Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Stok (plain, no animation) - OUTSIDE TABLE */}
      {stockModal.open && stockModal.data && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setStockModal({ open: false }); setModalTargetTanggal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-700 flex items-center gap-2">
                <FiPlus /> Tambah Stok
              </h3>
              <button onClick={() => { setStockModal({ open: false }); setModalTargetTanggal(null); }} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="mb-3">
              <div className="text-sm text-gray-700 font-semibold mb-1">{stockModal.data.operator} - {stockModal.data.jenis_paket}</div>
              <div className="text-xs text-gray-500">Stok Saat Ini: <span className="font-bold text-blue-600">{stockModal.data.stok_saat_ini}</span></div>
            </div>
              <form onSubmit={async e => {
              e.preventDefault();
              if (!stockModal.data) return;
              const parsed = Number(tambahStok);
              if (!isFinite(parsed) || parsed <= 0) {
                toast.error('Jumlah stok harus berupa angka lebih dari 0');
                return;
              }
              // Create a timestamped record for this action so each action appears separately in Riwayat
              const tanggal = modalTargetTanggal ? buildTimestampForDate(modalTargetTanggal) : new Date().toISOString();
              const voucherId = stockModal.data.id;
              try {
                // Always create a new timestamped row for this action to preserve history.
                // (If you prefer merging into existing date row, switch to update flow.)
                await dailyVoucherApi.create({
                  voucher_id: voucherId,
                  tanggal,
                  masuk: parsed,
                  sisa: stockModal.data.stok_saat_ini + parsed,
                  catatan: 'Penambahan stok'
                });
                toast.success('Stok berhasil ditambahkan');
                setStockModal({ open: false });
                setModalTargetTanggal(null);
                fetchMasterVouchers();
                fetchDailyStocks();
              } catch (err) {
                console.error('Error tambah stok:', err);
                toast.error('Gagal menambah stok');
              }
            }}>
              <input
                type="number"
                value={tambahStok}
                onChange={e => setTambahStok(e.target.value)}
                min={1}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                placeholder="Jumlah stok baru"
                autoFocus
                required
              />
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all">Tambah</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Input Sisa (plain, no animation) - OUTSIDE TABLE */}
      {sisaModal.open && sisaModal.data && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setSisaModal({ open: false }); setModalTargetTanggal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                <FiPackage /> Input Sisa
              </h3>
              <button onClick={() => { setSisaModal({ open: false }); setModalTargetTanggal(null); }} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="mb-3">
              <div className="text-sm text-gray-700 font-semibold mb-1">{sisaModal.data.operator} - {sisaModal.data.jenis_paket}</div>
              <div className="text-xs text-gray-500">Stok Saat Ini: <span className="font-bold text-blue-600">{sisaModal.data.stok_saat_ini}</span></div>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              if (!sisaModal.data) return;
              if (inputSisa < 0) {
                toast.error('Sisa stok tidak boleh negatif');
                return;
              }
              const tanggal = modalTargetTanggal ? buildTimestampForDate(modalTargetTanggal) : new Date().toISOString();
              const voucherId = sisaModal.data.id;
              try {
                // Always create a new timestamped record for this action to preserve history.
                await dailyVoucherApi.create({
                  voucher_id: voucherId,
                  tanggal,
                  masuk: 0,
                  sisa: inputSisa,
                  catatan: 'Input sisa stok akhir hari'
                });
                toast.success('Sisa stok berhasil diinput');
                setSisaModal({ open: false });
                setModalTargetTanggal(null);
                fetchMasterVouchers();
                fetchDailyStocks();
              } catch (err) {
                console.error('Error input sisa:', err);
                toast.error('Gagal input sisa stok');
              }
            }}>
              <input
                type="number"
                value={inputSisa}
                onChange={e => setInputSisa(Number(e.target.value))}
                min={0}
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                placeholder="Sisa stok akhir hari"
                autoFocus
                required
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all">Simpan</button>
            </form>
          </div>
        </div>
      )}

      </div>
  );
}
