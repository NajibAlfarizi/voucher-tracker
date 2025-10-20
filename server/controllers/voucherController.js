import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: parse date-only string into start/end range
const buildDateRange = (dateStr) => {
  const startDate = new Date(dateStr);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return { startDate, endDate };
};

// GET /api/vouchers - Ambil semua daily stock (terbaru dulu)
export const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await prisma.voucherDailyStock.findMany({
      include: { voucher: true },
      orderBy: { tanggal: 'desc' }
    });
    res.json({
      success: true,
      data: vouchers,
      total: vouchers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data voucher",
      error: error.message
    });
  }
};

// GET /api/vouchers/:id - Ambil detail 1 daily stock record
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await prisma.voucherDailyStock.findUnique({
      where: { id: parseInt(id) },
      include: { voucher: true }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data voucher",
      error: error.message
    });
  }
};

// POST /api/vouchers - Tambah daily stock record
// Accepts either voucher_id OR operator+jenis_paket to identify the MasterVoucher
// Accepts stok_awal, masuk, sisa OR terjual/keluar (compat)
export const createVoucher = async (req, res) => {
  try {
    const {
      tanggal,
      voucher_id,
      operator,
      jenis_paket,
      stok_awal,
      masuk,
      sisa,
      terjual,
      keluar,
      catatan
    } = req.body;

    // Resolve master voucher
    let masterVoucherId = voucher_id ? parseInt(voucher_id) : null;

    if (!masterVoucherId) {
      if (!operator || !jenis_paket) {
        return res.status(400).json({ success: false, message: 'voucher_id or (operator and jenis_paket) diperlukan' });
      }

      const mv = await prisma.masterVoucher.findUnique({ where: { operator_jenis_paket: { operator, jenis_paket } } }).catch(() => null);
      if (!mv) {
        return res.status(400).json({ success: false, message: 'MasterVoucher tidak ditemukan untuk operator/jenis_paket yang diberikan' });
      }
      masterVoucherId = mv.id;
    }

    const stokAwal = stok_awal !== undefined ? parseInt(stok_awal) : 0;
    const masukQty = masuk !== undefined ? parseInt(masuk) : 0;

    // Determine terjual and sisa based on provided fields (compatibility)
    let terjualQty = terjual !== undefined ? parseInt(terjual) : (keluar !== undefined ? parseInt(keluar) : undefined);
    let sisaQty = sisa !== undefined ? parseInt(sisa) : undefined;

    if (sisaQty === undefined && terjualQty === undefined) {
      // If neither provided, compute terjual from stokAwal/masuk and assume sisa = 0
      terjualQty = 0;
      sisaQty = stokAwal + masukQty - terjualQty;
    } else if (sisaQty === undefined && terjualQty !== undefined) {
      sisaQty = stokAwal + masukQty - terjualQty;
    } else if (sisaQty !== undefined && terjualQty === undefined) {
      terjualQty = stokAwal + masukQty - sisaQty;
    }

    const tanggalDate = tanggal ? new Date(tanggal) : new Date();

    try {
      const created = await prisma.voucherDailyStock.create({
        data: {
          voucher_id: masterVoucherId,
          tanggal: tanggalDate,
          stok_awal: stokAwal,
          masuk: masukQty,
          sisa: sisaQty,
          terjual: terjualQty,
          catatan: catatan || null
        }
      });

      return res.status(201).json({ success: true, message: 'Voucher berhasil ditambahkan', data: created });
    } catch (err) {
      // Handle unique constraint (voucher_id + tanggal)
      if (err && err.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Record untuk voucher dan tanggal ini sudah ada' });
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan voucher', error: error.message });
  }
};

// PUT /api/vouchers/:id - Update daily stock record
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tanggal,
      voucher_id,
      operator,
      jenis_paket,
      stok_awal,
      masuk,
      sisa,
      terjual,
      keluar,
      catatan
    } = req.body;

    const existing = await prisma.voucherDailyStock.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Voucher tidak ditemukan' });
    }

    // Optionally resolve voucher_id from operator+jenis_paket
    let masterVoucherId = voucher_id ? parseInt(voucher_id) : existing.voucher_id;
    if (!voucher_id && (operator && jenis_paket)) {
      const mv = await prisma.masterVoucher.findUnique({ where: { operator_jenis_paket: { operator, jenis_paket } } }).catch(() => null);
      if (mv) masterVoucherId = mv.id;
    }

    const stokAwal = stok_awal !== undefined ? parseInt(stok_awal) : existing.stok_awal;
    const masukQty = masuk !== undefined ? parseInt(masuk) : existing.masuk;

    let terjualQty = terjual !== undefined ? parseInt(terjual) : (keluar !== undefined ? parseInt(keluar) : existing.terjual);
    let sisaQty = sisa !== undefined ? parseInt(sisa) : existing.sisa;

    if (sisaQty === undefined && terjualQty === undefined) {
      terjualQty = existing.terjual || 0;
      sisaQty = stokAwal + masukQty - terjualQty;
    } else if (sisaQty === undefined && terjualQty !== undefined) {
      sisaQty = stokAwal + masukQty - terjualQty;
    } else if (sisaQty !== undefined && terjualQty === undefined) {
      terjualQty = stokAwal + masukQty - sisaQty;
    }

    const updated = await prisma.voucherDailyStock.update({
      where: { id: parseInt(id) },
      data: {
        voucher_id: masterVoucherId,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        stok_awal: stokAwal,
        masuk: masukQty,
        sisa: sisaQty,
        terjual: terjualQty,
        catatan: catatan !== undefined ? catatan : undefined
      }
    });

    res.json({ success: true, message: 'Voucher berhasil diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengupdate voucher', error: error.message });
  }
};

// DELETE /api/vouchers/:id - Hapus daily stock record
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.voucherDailyStock.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Voucher tidak ditemukan' });

    await prisma.voucherDailyStock.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Voucher berhasil dihapus', data: existing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus voucher', error: error.message });
  }
};

// GET /api/vouchers/filter?operator=Telkomsel&date=2025-10-10 - Filter voucher
export const filterVouchers = async (req, res) => {
  try {
    const { operator, date } = req.query;

    const where = {};

    if (operator) {
      where.voucher = { operator: { contains: operator, mode: 'insensitive' } };
    }

    if (date) {
      const { startDate, endDate } = buildDateRange(date);
      where.tanggal = { gte: startDate, lt: endDate };
    }

    const vouchers = await prisma.voucherDailyStock.findMany({
      where,
      include: { voucher: true },
      orderBy: { tanggal: 'desc' }
    });

    res.json({ success: true, data: vouchers, total: vouchers.length, filter: { operator, date } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memfilter voucher', error: error.message });
  }
};
