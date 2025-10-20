import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/wallets - Ambil semua saldo e-wallet
export const getAllWallets = async (req, res) => {
  try {
    const wallets = await prisma.saldoWallet.findMany({
      orderBy: { tanggal: 'desc' }
    });
    res.json({
      success: true,
      data: wallets,
      total: wallets.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data wallet",
      error: error.message
    });
  }
};

// GET /api/wallets/:id - Ambil detail e-wallet tertentu
export const getWalletById = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await prisma.saldoWallet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data wallet",
      error: error.message
    });
  }
};

// POST /api/wallets - Tambah catatan saldo baru
export const createWallet = async (req, res) => {
  try {
    const { tanggal, nama_wallet, saldo_awal, masuk, keluar } = req.body;

    // Validasi input
    if (!tanggal || !nama_wallet) {
      return res.status(400).json({
        success: false,
        message: "Tanggal dan nama wallet wajib diisi"
      });
    }

    // Hitung sisa otomatis
    const sisa = (saldo_awal || 0) + (masuk || 0) - (keluar || 0);

    const newWallet = await prisma.saldoWallet.create({
      data: {
        tanggal: new Date(tanggal),
        nama_wallet,
        saldo_awal: saldo_awal || 0,
        masuk: masuk || 0,
        keluar: keluar || 0,
        sisa
      }
    });

    res.status(201).json({
      success: true,
      message: "Data wallet berhasil ditambahkan",
      data: newWallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan data wallet",
      error: error.message
    });
  }
};

// PUT /api/wallets/:id - Update saldo
export const updateWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, nama_wallet, saldo_awal, masuk, keluar } = req.body;

    // Cek apakah wallet ada
    const existingWallet = await prisma.saldoWallet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingWallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet tidak ditemukan"
      });
    }

    // Hitung sisa otomatis
    const saldoAwal = saldo_awal !== undefined ? saldo_awal : existingWallet.saldo_awal;
    const masukAmount = masuk !== undefined ? masuk : existingWallet.masuk;
    const keluarAmount = keluar !== undefined ? keluar : existingWallet.keluar;
    const sisa = saldoAwal + masukAmount - keluarAmount;

    const updatedWallet = await prisma.saldoWallet.update({
      where: { id: parseInt(id) },
      data: {
        tanggal: tanggal ? new Date(tanggal) : undefined,
        nama_wallet: nama_wallet || undefined,
        saldo_awal: saldoAwal,
        masuk: masukAmount,
        keluar: keluarAmount,
        sisa
      }
    });

    res.json({
      success: true,
      message: "Data wallet berhasil diupdate",
      data: updatedWallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate data wallet",
      error: error.message
    });
  }
};

// DELETE /api/wallets/:id - Hapus data saldo
export const deleteWallet = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah wallet ada
    const existingWallet = await prisma.saldoWallet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingWallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet tidak ditemukan"
      });
    }

    await prisma.saldoWallet.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: "Data wallet berhasil dihapus",
      data: existingWallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus data wallet",
      error: error.message
    });
  }
};

// GET /api/wallets/summary - Rekap total saldo seluruh wallet
export const getWalletSummary = async (req, res) => {
  try {
    // Ambil data wallet terbaru untuk setiap nama_wallet
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

    res.json({
      success: true,
      summary: {
        total_wallet: latestWallets.length,
        total_saldo: totalSaldo,
        total_masuk: totalMasuk,
        total_keluar: totalKeluar
      },
      wallets: latestWallets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil summary wallet",
      error: error.message
    });
  }
};
