import { PrismaClient } from '@prisma/client';
import { nowWIB, parseTanggalWIB } from '../utils/timezone.js';

const prisma = new PrismaClient();

// ==================== MASTER WALLET ====================

// Get all master wallets
export const getAllMasterWallets = async (req, res) => {
  try {
    const wallets = await prisma.masterWallet.findMany({
      include: {
        _count: {
          select: { transaksi: true }
        }
      },
      orderBy: { nama_wallet: 'asc' }
    });

    res.json({
      success: true,
      data: wallets,
      total: wallets.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data master wallet',
      error: error.message
    });
  }
};

// Get single master wallet with transactions
export const getMasterWalletById = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await prisma.masterWallet.findUnique({
      where: { id: parseInt(id) },
      include: {
        transaksi: {
          orderBy: { tanggal: 'desc' },
          take: 50
        }
      }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Master wallet tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data master wallet',
      error: error.message
    });
  }
};

// Create new master wallet
export const createMasterWallet = async (req, res) => {
  try {
    const { nama_wallet, saldo_awal } = req.body;

    if (!nama_wallet) {
      return res.status(400).json({
        success: false,
        message: 'Nama wallet harus diisi'
      });
    }

    const wallet = await prisma.masterWallet.create({
      data: {
        nama_wallet,
        saldo_saat_ini: saldo_awal || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Master wallet berhasil ditambahkan',
      data: wallet
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Wallet dengan nama ini sudah ada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Gagal menambah master wallet',
      error: error.message
    });
  }
};

// Update master wallet
export const updateMasterWallet = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept nama_wallet and allow updating saldo_awal / saldo_saat_ini
    const { nama_wallet, saldo_awal, saldo_saat_ini } = req.body;

    const data = {};
    if (nama_wallet !== undefined) data.nama_wallet = nama_wallet;
    // prefer explicit saldo_saat_ini, fallback to saldo_awal for compatibility
    if (saldo_saat_ini !== undefined) {
      data.saldo_saat_ini = saldo_saat_ini;
    } else if (saldo_awal !== undefined) {
      data.saldo_saat_ini = saldo_awal;
    }

    const wallet = await prisma.masterWallet.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      success: true,
      message: 'Master wallet berhasil diupdate',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal update master wallet',
      error: error.message
    });
  }
};

// Delete master wallet
export const deleteMasterWallet = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.masterWallet.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Master wallet berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus master wallet',
      error: error.message
    });
  }
};

// ==================== WALLET TRANSACTIONS ====================

// Get all wallet transactions
export const getAllWalletTransactions = async (req, res) => {
  try {
    const { wallet_id, tipe, tanggal_dari, tanggal_sampai, sort = 'desc', scope } = req.query;
    const { startOfDayWIB, endOfDayWIB } = await import('../utils/timezone.js');
    
    const where = {};
    if (wallet_id) where.wallet_id = parseInt(wallet_id);
    if (tipe && tipe !== 'all') where.tipe = tipe;
    
    // Logic tanggal berdasarkan scope
    if (scope === 'history') {
      // Untuk riwayat: tampilkan semua data (kecuali ada filter tanggal khusus)
      if (tanggal_dari || tanggal_sampai) {
        where.tanggal = {};
        if (tanggal_dari) where.tanggal.gte = new Date(tanggal_dari);
        if (tanggal_sampai) where.tanggal.lte = new Date(tanggal_sampai);
      }
      console.log(`[WALLET TRANSACTIONS] Scope=history: tampilkan semua data`);
    } else {
      // Default: filter hari ini saja (untuk dashboard dan total harian)
      const todayStart = startOfDayWIB();
      const todayEnd = endOfDayWIB();
      where.tanggal = { gte: todayStart, lte: todayEnd };
      console.log(`[WALLET TRANSACTIONS] Scope=daily: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
      
      // Override jika ada parameter tanggal khusus (untuk laporan)
      if (tanggal_dari || tanggal_sampai) {
        where.tanggal = {};
        if (tanggal_dari) where.tanggal.gte = new Date(tanggal_dari);
        if (tanggal_sampai) where.tanggal.lte = new Date(tanggal_sampai);
        console.log(`[WALLET TRANSACTIONS] Override dengan rentang tanggal khusus`);
      }
    }
    const transaksi = await prisma.walletTransaction.findMany({
      where,
      include: {
        wallet: true
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

// Create wallet transaction (masuk/keluar)
export const createWalletTransaction = async (req, res) => {
  try {
    const { wallet_id, tipe, jumlah, keterangan, tanggal } = req.body;

    // Validate
    if (!['masuk', 'keluar'].includes(tipe)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe transaksi harus "masuk" atau "keluar"'
      });
    }

    // Get current balance
    const wallet = await prisma.masterWallet.findUnique({
      where: { id: parseInt(wallet_id) }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet tidak ditemukan'
      });
    }

    // Check if balance sufficient for keluar
    if (tipe === 'keluar' && wallet.saldo_saat_ini < jumlah) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak cukup! Saldo saat ini: Rp ${wallet.saldo_saat_ini.toLocaleString()}, diminta: Rp ${jumlah.toLocaleString()}`
      });
    }

    // Calculate new balance
    const newSaldo = tipe === 'masuk' 
      ? wallet.saldo_saat_ini + parseFloat(jumlah) 
      : wallet.saldo_saat_ini - parseFloat(jumlah);

    // Create transaction and update balance
    const result = await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          wallet_id: parseInt(wallet_id),
          tipe,
          jumlah: parseFloat(jumlah),
          keterangan,
          tanggal: tanggal ? parseTanggalWIB(tanggal) : nowWIB()
        }
      }),
      prisma.masterWallet.update({
        where: { id: parseInt(wallet_id) },
        data: { saldo_saat_ini: newSaldo }
      })
    ]);

    res.status(201).json({
      success: true,
      message: `Transaksi ${tipe} berhasil! Saldo sekarang: Rp ${newSaldo.toLocaleString()}`,
      data: result[0],
      saldo_baru: newSaldo
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
export const deleteWalletTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.walletTransaction.findUnique({
      where: { id: parseInt(id) },
      include: { wallet: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    // Reverse the balance change
    const newSaldo = transaction.tipe === 'masuk'
      ? transaction.wallet.saldo_saat_ini - transaction.jumlah
      : transaction.wallet.saldo_saat_ini + transaction.jumlah;

    await prisma.$transaction([
      prisma.walletTransaction.delete({
        where: { id: parseInt(id) }
      }),
      prisma.masterWallet.update({
        where: { id: transaction.wallet_id },
        data: { saldo_saat_ini: newSaldo }
      })
    ]);

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus dan saldo dikembalikan',
      saldo_baru: newSaldo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi',
      error: error.message
    });
  }
};

// Get wallet statistics
export const getWalletStatistics = async (req, res) => {
  try {
    const { tanggal_dari, tanggal_sampai } = req.query;
    const { startOfDayWIB, endOfDayWIB } = await import('../utils/timezone.js');
    
    const where = {};
    
    // SELALU filter hari ini untuk statistik - data reset setiap hari baru
    const todayStart = startOfDayWIB();
    const todayEnd = endOfDayWIB();
    where.tanggal = { gte: todayStart, lte: todayEnd };
    console.log(`[WALLET STATISTICS] Filter hari ini: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
    
    // Override jika ada parameter tanggal khusus (untuk laporan)
    if (tanggal_dari || tanggal_sampai) {
      where.tanggal = {};
      if (tanggal_dari) where.tanggal.gte = new Date(tanggal_dari);
      if (tanggal_sampai) where.tanggal.lte = new Date(tanggal_sampai);
      console.log(`[WALLET STATISTICS] Override dengan rentang tanggal khusus`);
    }

    const [totalMasuk, totalKeluar, allWallets] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { ...where, tipe: 'masuk' },
        _sum: { jumlah: true }
      }),
      prisma.walletTransaction.aggregate({
        where: { ...where, tipe: 'keluar' },
        _sum: { jumlah: true }
      }),
      prisma.masterWallet.findMany()
    ]);

    const totalSaldo = allWallets.reduce((sum, w) => sum + w.saldo_saat_ini, 0);

    res.json({
      success: true,
      data: {
        total_wallet: allWallets.length,
        total_saldo_saat_ini: totalSaldo,
        total_masuk: totalMasuk._sum.jumlah || 0,
        total_keluar: totalKeluar._sum.jumlah || 0,
        wallets: allWallets
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
