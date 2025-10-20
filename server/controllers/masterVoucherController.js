import { PrismaClient } from '@prisma/client';
import { nowWIB, parseTanggalWIB } from '../utils/timezone.js';

const prisma = new PrismaClient();

// ==================== MASTER VOUCHER ====================

// Get all master vouchers
export const getAllMasterVouchers = async (req, res) => {
  try {
    const vouchers = await prisma.masterVoucher.findMany({
      include: {
        _count: {
          select: { transaksi: true }
        }
      },
      orderBy: { operator: 'asc' }
    });

    res.json({
      success: true,
      data: vouchers,
      total: vouchers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data master voucher',
      error: error.message
    });
  }
};

// Get single master voucher with transactions
export const getMasterVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await prisma.masterVoucher.findUnique({
      where: { id: parseInt(id) },
      include: {
        transaksi: {
          orderBy: { tanggal: 'desc' },
          take: 50 // Last 50 transactions
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Master voucher tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data master voucher',
      error: error.message
    });
  }
};

// Create new master voucher
export const createMasterVoucher = async (req, res) => {
  try {
    const { operator, jenis_paket, stok_awal } = req.body;

    const voucher = await prisma.masterVoucher.create({
      data: {
        operator,
        jenis_paket,
        stok_saat_ini: stok_awal || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Master voucher berhasil ditambahkan',
      data: voucher
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Voucher dengan operator dan jenis paket ini sudah ada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Gagal menambah master voucher',
      error: error.message
    });
  }
};

// Update master voucher
export const updateMasterVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // allow updating operator, jenis_paket and stok_awal/stok_saat_ini
    const { operator, jenis_paket, stok_awal, stok_saat_ini } = req.body;

    const data = {};
    if (operator !== undefined) data.operator = operator;
    if (jenis_paket !== undefined) data.jenis_paket = jenis_paket;
    // Accept stok_awal (from older clients) and stok_saat_ini; prefer explicit stok_saat_ini if provided
    if (stok_saat_ini !== undefined) {
      data.stok_saat_ini = stok_saat_ini;
    } else if (stok_awal !== undefined) {
      data.stok_saat_ini = stok_awal;
    }

    const voucher = await prisma.masterVoucher.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      success: true,
      message: 'Master voucher berhasil diupdate',
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal update master voucher',
      error: error.message
    });
  }
};

// Delete master voucher
export const deleteMasterVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.masterVoucher.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Master voucher berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus master voucher',
      error: error.message
    });
  }
};

// ==================== VOUCHER TRANSACTIONS ====================

// Get all voucher transactions
export const getAllVoucherTransactions = async (req, res) => {
  try {
    const { voucher_id, tipe, tanggal_dari, tanggal_sampai, sort = 'desc', scope } = req.query;
    const { startOfDayWIB, endOfDayWIB } = await import('../utils/timezone.js');
    
    const where = {};
    if (voucher_id) where.voucher_id = parseInt(voucher_id);
    if (tipe && tipe !== 'all') where.tipe = tipe;
    
    // Logic tanggal berdasarkan scope
    if (scope === 'history') {
      // Untuk riwayat: tampilkan semua data (kecuali ada filter tanggal khusus)
      if (tanggal_dari || tanggal_sampai) {
        where.tanggal = {};
        if (tanggal_dari) where.tanggal.gte = new Date(tanggal_dari);
        if (tanggal_sampai) where.tanggal.lte = new Date(tanggal_sampai);
      }
      console.log(`[VOUCHER TRANSACTIONS] Scope=history: tampilkan semua data`);
    } else {
      // Default: filter hari ini saja (untuk dashboard dan terjual harian)
      const todayStart = startOfDayWIB();
      const todayEnd = endOfDayWIB();
      where.tanggal = { gte: todayStart, lte: todayEnd };
      console.log(`[VOUCHER TRANSACTIONS] Scope=daily: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
      
      // Override jika ada parameter tanggal khusus (untuk laporan)
      if (tanggal_dari || tanggal_sampai) {
        where.tanggal = {};
        if (tanggal_dari) where.tanggal.gte = new Date(tanggal_dari);
        if (tanggal_sampai) where.tanggal.lte = new Date(tanggal_sampai);
        console.log(`[VOUCHER TRANSACTIONS] Override dengan rentang tanggal khusus`);
      }
    }
    const transaksi = await prisma.voucherTransaction.findMany({
      where,
      include: {
        voucher: true
      },
      orderBy: [
        { tanggal: sort === 'asc' ? 'asc' : 'desc' },
        { id: 'desc' }
      ]
    });
    res.json({
      success: true,
      data: transaksi,
      total: transaksi.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi',
      error: error.message
    });
  }
};

// Create voucher transaction (masuk/keluar)
export const createVoucherTransaction = async (req, res) => {
  try {
    const { voucher_id, tipe, jumlah, keterangan, tanggal } = req.body;

    // Validate
    if (!['masuk', 'keluar'].includes(tipe)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe transaksi harus "masuk" atau "keluar"'
      });
    }

    // Get current stock
    const voucher = await prisma.masterVoucher.findUnique({
      where: { id: parseInt(voucher_id) }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher tidak ditemukan'
      });
    }

    // Check if stock sufficient for keluar
    if (tipe === 'keluar' && voucher.stok_saat_ini < jumlah) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak cukup! Stok saat ini: ${voucher.stok_saat_ini}, diminta: ${jumlah}`
      });
    }

    // Calculate new stock
    const newStok = tipe === 'masuk' 
      ? voucher.stok_saat_ini + jumlah 
      : voucher.stok_saat_ini - jumlah;

    // Create transaction and update stock in a transaction
    const result = await prisma.$transaction([
      prisma.voucherTransaction.create({
        data: {
          voucher_id: parseInt(voucher_id),
          tipe,
          jumlah: parseInt(jumlah),
          keterangan,
          tanggal: tanggal ? parseTanggalWIB(tanggal) : nowWIB()
        }
      }),
      prisma.masterVoucher.update({
        where: { id: parseInt(voucher_id) },
        data: { stok_saat_ini: newStok }
      })
    ]);

    res.status(201).json({
      success: true,
      message: `Transaksi ${tipe} berhasil! Stok sekarang: ${newStok}`,
      data: result[0],
      stok_baru: newStok
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi',
      error: error.message
    });
  }
};

// Delete transaction
export const deleteVoucherTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.voucherTransaction.findUnique({
      where: { id: parseInt(id) },
      include: { voucher: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    // Reverse the stock change
    const newStok = transaction.tipe === 'masuk'
      ? transaction.voucher.stok_saat_ini - transaction.jumlah
      : transaction.voucher.stok_saat_ini + transaction.jumlah;

    await prisma.$transaction([
      prisma.voucherTransaction.delete({
        where: { id: parseInt(id) }
      }),
      prisma.masterVoucher.update({
        where: { id: transaction.voucher_id },
        data: { stok_saat_ini: newStok }
      })
    ]);

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus dan stok dikembalikan',
      stok_baru: newStok
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi',
      error: error.message
    });
  }
};

// Get voucher statistics
export const getVoucherStatistics = async (req, res) => {
  try {
    const { tanggal_dari, tanggal_sampai } = req.query;
    const { startOfDayWIB, endOfDayWIB } = await import('../utils/timezone.js');
    
    const where = {};
    
    // SELALU filter hari ini untuk statistik - data reset setiap hari baru
    const todayStart = startOfDayWIB();
    const todayEnd = endOfDayWIB();
    where.tanggal = { gte: todayStart, lte: todayEnd };
    console.log(`[VOUCHER STATISTICS] Filter hari ini: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
    
    // Override jika ada parameter tanggal khusus (untuk laporan)
    if (tanggal_dari || tanggal_sampai) {
      where.tanggal = {};
      if (tanggal_dari) where.tanggal.gte = new Date(tanggal_dari);
      if (tanggal_sampai) where.tanggal.lte = new Date(tanggal_sampai);
      console.log(`[VOUCHER STATISTICS] Override dengan rentang tanggal khusus`);
    }

    const [totalMasuk, totalKeluar, allVouchers] = await Promise.all([
      prisma.voucherTransaction.aggregate({
        where: { ...where, tipe: 'masuk' },
        _sum: { jumlah: true }
      }),
      prisma.voucherTransaction.aggregate({
        where: { ...where, tipe: 'keluar' },
        _sum: { jumlah: true }
      }),
      prisma.masterVoucher.findMany()
    ]);

    const totalStok = allVouchers.reduce((sum, v) => sum + v.stok_saat_ini, 0);

    res.json({
      success: true,
      data: {
        total_produk: allVouchers.length,
        total_stok_saat_ini: totalStok,
        total_masuk: totalMasuk._sum.jumlah || 0,
        total_keluar: totalKeluar._sum.jumlah || 0,
        vouchers: allVouchers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik',
      error: error.message
    });
  }
};
