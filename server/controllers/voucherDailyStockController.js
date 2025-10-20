import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/voucher-daily - List all daily voucher stock records
export const getAllVoucherDailyStock = async (req, res) => {
  try {
    const records = await prisma.voucherDailyStock.findMany({
      include: { voucher: true },
      orderBy: { tanggal: "desc" }
    });
    res.json({ success: true, data: records, total: records.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data harian", error: error.message });
  }
};

// GET /api/voucher-daily/:id - Get detail of a daily stock record
export const getVoucherDailyStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.voucherDailyStock.findUnique({
      where: { id: parseInt(id) },
      include: { voucher: true }
    });
    if (!record) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail data", error: error.message });
  }
};

// POST /api/voucher-daily - Input harian (input: voucher_id, tanggal, sisa, masuk, catatan)
export const createVoucherDailyStock = async (req, res) => {
  try {
    const { voucher_id, tanggal, sisa, masuk, catatan } = req.body;
    if (!voucher_id || !tanggal || sisa === undefined) {
      return res.status(400).json({ success: false, message: "voucher_id, tanggal, dan sisa wajib diisi" });
    }
    // Cek master voucher
    const master = await prisma.masterVoucher.findUnique({ where: { id: voucher_id } });
    if (!master) return res.status(404).json({ success: false, message: "Master voucher tidak ditemukan" });

    // Cek data harian sebelumnya (hari sebelum tanggal input)
    const prev = await prisma.voucherDailyStock.findFirst({
      where: {
        voucher_id,
        tanggal: { lt: new Date(tanggal) }
      },
      orderBy: { tanggal: "desc" }
    });
    const stok_awal = prev ? prev.sisa : master.stok_saat_ini;
    const masukQty = masuk || 0;
    const terjual = stok_awal + masukQty - sisa;

    // Simpan data harian
    const newDaily = await prisma.voucherDailyStock.create({
      data: {
        voucher_id,
        tanggal: new Date(tanggal),
        stok_awal,
        masuk: masukQty,
        sisa,
        terjual,
        catatan: catatan || null
      }
    });

    // Update stok_saat_ini di master
    await prisma.masterVoucher.update({
      where: { id: voucher_id },
      data: { stok_saat_ini: sisa }
    });

    res.status(201).json({ success: true, message: "Input harian berhasil", data: newDaily });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal input harian", error: error.message });
  }
};

// PUT /api/voucher-daily/:id - Update data harian
export const updateVoucherDailyStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { sisa, masuk, catatan } = req.body;
    const existing = await prisma.voucherDailyStock.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    const stok_awal = existing.stok_awal;
    const masukQty = masuk !== undefined ? masuk : existing.masuk;
    const sisaQty = sisa !== undefined ? sisa : existing.sisa;
    const terjual = stok_awal + masukQty - sisaQty;
    const updated = await prisma.voucherDailyStock.update({
      where: { id: parseInt(id) },
      data: { sisa: sisaQty, masuk: masukQty, terjual, catatan: catatan !== undefined ? catatan : existing.catatan }
    });
    // Update stok_saat_ini di master jika ini record terbaru
    const latest = await prisma.voucherDailyStock.findFirst({
      where: { voucher_id: existing.voucher_id },
      orderBy: { tanggal: "desc" }
    });
    if (latest && latest.id === updated.id) {
      await prisma.masterVoucher.update({ where: { id: existing.voucher_id }, data: { stok_saat_ini: sisaQty } });
    }
    res.json({ success: true, message: "Data harian berhasil diupdate", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal update data harian", error: error.message });
  }
};

// DELETE /api/voucher-daily/:id - Hapus data harian
export const deleteVoucherDailyStock = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.voucherDailyStock.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    await prisma.voucherDailyStock.delete({ where: { id: parseInt(id) } });
    // Update stok_saat_ini di master jika ini record terbaru
    const latest = await prisma.voucherDailyStock.findFirst({
      where: { voucher_id: existing.voucher_id },
      orderBy: { tanggal: "desc" }
    });
    if (latest) {
      await prisma.masterVoucher.update({ where: { id: existing.voucher_id }, data: { stok_saat_ini: latest.sisa } });
    }
    res.json({ success: true, message: "Data harian berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal hapus data harian", error: error.message });
  }
};

// GET /api/voucher-daily/by-voucher/:voucher_id - List harian by voucher
export const getVoucherDailyStockByVoucher = async (req, res) => {
  try {
    const { voucher_id } = req.params;
    const records = await prisma.voucherDailyStock.findMany({
      where: { voucher_id: parseInt(voucher_id) },
      orderBy: { tanggal: "desc" }
    });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data", error: error.message });
  }
};
