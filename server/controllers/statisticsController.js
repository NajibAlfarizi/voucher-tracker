import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/statistics/voucher-summary - Ringkasan stok voucher per operator
export const getVoucherSummary = async (req, res) => {
  try {
    const vouchers = await prisma.voucherDailyStock.findMany({
      include: { voucher: true },
      orderBy: { tanggal: 'desc' }
    });

    // Kelompokkan berdasarkan operator
    const operatorMap = new Map();
    
    vouchers.forEach(voucher => {
      // voucher is a VoucherDailyStock with relation `voucher` (MasterVoucher)
      const op = voucher.voucher?.operator || 'Unknown';
      const jenis = voucher.voucher?.jenis_paket || 'Unknown';
      const key = `${op}-${jenis}`;
      if (!operatorMap.has(key)) {
        operatorMap.set(key, {
          operator: op,
          jenis_paket: jenis,
          total_stok_awal: 0,
          total_masuk: 0,
          total_terjual: 0,
          total_sisa: 0,
          jumlah_transaksi: 0
        });
      }

      const summary = operatorMap.get(key);
      summary.total_stok_awal += voucher.stok_awal || 0;
      summary.total_masuk += voucher.masuk || 0;
      summary.total_terjual += voucher.terjual || 0;
      summary.total_sisa += voucher.sisa || 0;
      summary.jumlah_transaksi += 1;
    });

    const summaryByOperator = Array.from(operatorMap.values());

    // Total keseluruhan
    const totalSummary = {
      total_stok_awal: summaryByOperator.reduce((sum, item) => sum + (item.total_stok_awal || 0), 0),
      total_masuk: summaryByOperator.reduce((sum, item) => sum + (item.total_masuk || 0), 0),
      total_terjual: summaryByOperator.reduce((sum, item) => sum + (item.total_terjual || 0), 0),
      total_sisa: summaryByOperator.reduce((sum, item) => sum + (item.total_sisa || 0), 0),
      total_transaksi: vouchers.length
    };

    res.json({
      success: true,
      data: {
        summary_per_operator: summaryByOperator,
        total_summary: totalSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil summary voucher",
      error: error.message
    });
  }
};

// GET /api/statistics/wallet-summary - Ringkasan total saldo semua e-wallet
export const getWalletSummary = async (req, res) => {
  try {
    const wallets = await prisma.saldoWallet.findMany({
      orderBy: { tanggal: 'desc' }
    });

    // Kelompokkan berdasarkan nama_wallet dan ambil yang terbaru
    const walletMap = new Map();
    wallets.forEach(wallet => {
      if (!walletMap.has(wallet.nama_wallet)) {
        walletMap.set(wallet.nama_wallet, wallet);
      }
    });

  const latestWallets = Array.from(walletMap.values());
    
    // Hitung total
    const totalSaldo = latestWallets.reduce((sum, wallet) => sum + wallet.sisa, 0);
    const totalMasuk = latestWallets.reduce((sum, wallet) => sum + wallet.masuk, 0);
    const totalKeluar = latestWallets.reduce((sum, wallet) => sum + wallet.keluar, 0);

    // Detail per wallet
    const walletDetails = latestWallets.map(wallet => ({
      nama_wallet: wallet.nama_wallet,
      saldo_awal: wallet.saldo_awal,
      masuk: wallet.masuk,
      keluar: wallet.keluar,
      sisa: wallet.sisa,
      tanggal_terakhir: wallet.tanggal
    }));

    res.json({
      success: true,
      data: {
        total_wallet: latestWallets.length,
        total_saldo: totalSaldo,
        total_masuk: totalMasuk,
        total_keluar: totalKeluar,
        wallets: walletDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil summary wallet",
      error: error.message
    });
  }
};

// GET /api/statistics/daily - Data gabungan voucher & wallet per tanggal
export const getDailyStatistics = async (req, res) => {
  try {
    const { date } = req.query;
    
  let startDate, endDate;
    
    if (date) {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      // Default: hari ini
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // Data voucher hari ini
    const vouchers = await prisma.voucherDailyStock.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Data wallet hari ini
    const wallets = await prisma.saldoWallet.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Statistik voucher
  const totalVoucherMasuk = vouchers.reduce((sum, v) => sum + (v.masuk || 0), 0);
  const totalVoucherTerjual = vouchers.reduce((sum, v) => sum + (v.terjual || 0), 0);
  const totalVoucherSisa = vouchers.reduce((sum, v) => sum + (v.sisa || 0), 0);

    // Statistik wallet
  const totalWalletMasuk = wallets.reduce((sum, w) => sum + (w.masuk || 0), 0);
  const totalWalletKeluar = wallets.reduce((sum, w) => sum + (w.keluar || 0), 0);
  const totalWalletSisa = wallets.reduce((sum, w) => sum + (w.sisa || 0), 0);

    res.json({
      success: true,
      date: startDate.toISOString().split('T')[0],
      data: {
        voucher: {
          total_transaksi: vouchers.length,
          total_voucher_masuk: totalVoucherMasuk,
          total_voucher_terjual: totalVoucherTerjual,
          total_voucher_sisa: totalVoucherSisa
        },
        wallet: {
          total_transaksi: wallets.length,
          total_masuk: totalWalletMasuk,
          total_keluar: totalWalletKeluar,
          total_sisa: totalWalletSisa
        },
        summary: {
          total_transaksi_voucher: vouchers.length,
          total_transaksi_wallet: wallets.length,
          total_voucher_terjual: totalVoucherKeluar,
          total_voucher_masuk: totalVoucherMasuk,
          total_wallet_sisa: totalWalletSisa
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik harian",
      error: error.message
    });
  }
};

// GET /api/statistics/dashboard - Dashboard overview (bonus)
export const getDashboardOverview = async (req, res) => {
  try {
  // Get master vouchers via findMany (avoid using .count() to prevent property access issues)
  let totalVouchers = 0;
  let voucherData = [];
  try {
    voucherData = await prisma.masterVoucher.findMany();
    totalVouchers = Array.isArray(voucherData) ? voucherData.length : 0;
  } catch (err) {
    voucherData = [];
    totalVouchers = 0;
  }

  // total remaining stock across master vouchers
  const totalVoucherSisa = voucherData.reduce((sum, v) => sum + (v.stok_saat_ini || 0), 0);

  // Sum terjual from daily stocks (defensive)
  let allDaily = [];
  try {
    allDaily = await prisma.voucherDailyStock.findMany();
  } catch (err) {
    allDaily = [];
  }
  const totalVoucherTerjual = allDaily.reduce((sum, d) => sum + (d.terjual || 0), 0);

    // Total wallet
    const walletData = await prisma.saldoWallet.findMany();
    const walletMap = new Map();
    walletData.forEach(wallet => {
      if (!walletMap.has(wallet.nama_wallet)) {
        walletMap.set(wallet.nama_wallet, wallet);
      }
    });
    const latestWallets = Array.from(walletMap.values());
    const totalWalletSaldo = latestWallets.reduce((sum, w) => sum + w.sisa, 0);

    // Data hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vouchersToday = await prisma.voucherDailyStock.findMany({
      where: {
        tanggal: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const walletsToday = await prisma.saldoWallet.findMany({
      where: {
        tanggal: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    res.json({
      success: true,
      data: {
        total_vouchers: Number(totalVouchers) || 0,
        total_voucher_sisa: Number(totalVoucherSisa) || 0,
        total_voucher_terjual: Number(totalVoucherTerjual) || 0,
        total_wallet_saldo: Number(totalWalletSaldo) || 0,
        transaksi_hari_ini: {
          voucher: Array.isArray(vouchersToday) ? vouchersToday.length : 0,
          wallet: Array.isArray(walletsToday) ? walletsToday.length : 0
        }
      }
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil dashboard overview",
      error: error.message
    });
  }
};
