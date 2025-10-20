import { PrismaClient } from '@prisma/client';
import { nowWIB, parseTanggalWIB } from '../utils/timezone.js';

const prisma = new PrismaClient();

// GET /api/wallet-daily - List all daily wallet stock records
export const getAllWalletDailyStock = async (req, res) => {
  try {
    const records = await prisma.walletDailyStock.findMany({ include: { wallet: true }, orderBy: { tanggal: 'desc' } });
    res.json({ success: true, data: records, total: records.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data harian wallet', error: error.message });
  }
};

export const getWalletDailyStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.walletDailyStock.findUnique({ where: { id: parseInt(id) }, include: { wallet: true } });
    if (!record) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail data', error: error.message });
  }
};

// POST /api/wallet-daily - Input harian (wallet_id, tanggal, sisa, masuk, catatan)
// Note: `keluar` is computed automatically as saldo_awal + masuk - sisa (same mechanism as vouchers)
export const createWalletDailyStock = async (req, res) => {
  try {
    const { wallet_id, tanggal, sisa, masuk, catatan } = req.body;
    // Validasi input
    if (!wallet_id || !tanggal || sisa === undefined) {
      return res.status(400).json({ success: false, message: 'wallet_id, tanggal, dan sisa wajib diisi' });
    }
    // Pastikan wallet_id berupa angka
    const walletIdNum = parseInt(wallet_id);
    if (isNaN(walletIdNum)) {
      return res.status(400).json({ success: false, message: 'wallet_id harus berupa angka' });
    }
    // Pastikan tanggal valid
    let tanggalObj;
    try {
      tanggalObj = new Date(tanggal);
      if (isNaN(tanggalObj.getTime())) throw new Error('Invalid date');
    } catch {
      return res.status(400).json({ success: false, message: 'Format tanggal tidak valid' });
    }
    const master = await prisma.masterWallet.findUnique({ where: { id: walletIdNum } });
    if (!master) return res.status(404).json({ success: false, message: 'Master wallet tidak ditemukan' });

    // Cari record harian sebelumnya
    const prev = await prisma.walletDailyStock.findFirst({
      where: { wallet_id: walletIdNum, tanggal: { lt: tanggalObj } },
      orderBy: { tanggal: 'desc' }
    });
    const saldo_awal = prev ? prev.sisa : master.saldo_saat_ini;
    const masukQty = masuk || 0;
    const sisaQty = sisa;
    const keluarQty = saldo_awal + masukQty - sisaQty;

    // Cek duplikat (unik wallet_id + tanggal)
    const existing = await prisma.walletDailyStock.findFirst({
      where: { wallet_id: walletIdNum, tanggal: tanggalObj }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Sudah ada input harian untuk wallet dan tanggal ini' });
    }

    const newDaily = await prisma.walletDailyStock.create({
      data: {
        wallet_id: walletIdNum,
        tanggal: tanggalObj,
        saldo_awal,
        masuk: masukQty,
        keluar: keluarQty,
        sisa: sisaQty,
        catatan: catatan || null
      }
    });

    await prisma.masterWallet.update({ where: { id: walletIdNum }, data: { saldo_saat_ini: sisaQty } });

    res.status(201).json({ success: true, message: 'Input harian wallet berhasil', data: newDaily });
  } catch (error) {
    // Log error detail ke console untuk debug
    console.error('[createWalletDailyStock]', error);
    res.status(500).json({ success: false, message: 'Gagal input harian wallet', error: error.message });
  }
};

export const updateWalletDailyStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { sisa, masuk, saldo_awal, catatan } = req.body;
    const existing = await prisma.walletDailyStock.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    // Default values
    const currentSaldoAwal = existing.saldo_awal;
    const masukQty = masuk !== undefined ? masuk : existing.masuk;

    let updatedData = {};

    if (saldo_awal !== undefined) {
      // If user corrects saldo_awal, preserve existing `keluar` (sold) and recalc `sisa`
      const newSaldoAwal = parseFloat(saldo_awal);
      const keluarQty = existing.keluar;
      const newSisa = newSaldoAwal + masukQty - keluarQty;
      updatedData = { saldo_awal: newSaldoAwal, masuk: masukQty, keluar: keluarQty, sisa: newSisa, catatan: catatan !== undefined ? catatan : existing.catatan };
    } else {
      // Default behavior: keep saldo_awal, allow updating masuk/sisa and recalc keluar
      const sisaQty = sisa !== undefined ? sisa : existing.sisa;
      const keluarQty = currentSaldoAwal + masukQty - sisaQty;
      updatedData = { sisa: sisaQty, masuk: masukQty, keluar: keluarQty, catatan: catatan !== undefined ? catatan : existing.catatan };
    }

    const updated = await prisma.walletDailyStock.update({ where: { id: parseInt(id) }, data: updatedData });

    // If this is the latest record, update master saldo
    const latest = await prisma.walletDailyStock.findFirst({ where: { wallet_id: existing.wallet_id }, orderBy: { tanggal: 'desc' } });
    if (latest && latest.id === updated.id) {
      await prisma.masterWallet.update({ where: { id: existing.wallet_id }, data: { saldo_saat_ini: updated.sisa } });
    }

    res.json({ success: true, message: 'Data harian wallet berhasil diupdate', data: updated });
  } catch (error) {
    console.error('[updateWalletDailyStock]', error);
    res.status(500).json({ success: false, message: 'Gagal update data harian wallet', error: error.message });
  }
};

export const deleteWalletDailyStock = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.walletDailyStock.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    await prisma.walletDailyStock.delete({ where: { id: parseInt(id) } });
    const latest = await prisma.walletDailyStock.findFirst({ where: { wallet_id: existing.wallet_id }, orderBy: { tanggal: 'desc' } });
    if (latest) {
      await prisma.masterWallet.update({ where: { id: existing.wallet_id }, data: { saldo_saat_ini: latest.sisa } });
    }
    res.json({ success: true, message: 'Data harian wallet berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal hapus data harian wallet', error: error.message });
  }
};

export const getWalletDailyStockByWallet = async (req, res) => {
  try {
    const { wallet_id } = req.params;
    const records = await prisma.walletDailyStock.findMany({ where: { wallet_id: parseInt(wallet_id) }, orderBy: { tanggal: 'desc' } });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: error.message });
  }
};
