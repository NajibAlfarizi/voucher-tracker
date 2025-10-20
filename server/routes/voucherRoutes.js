import express from 'express';
import {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  filterVouchers
} from '../controllers/voucherController.js';

const router = express.Router();

// GET /api/vouchers/filter - harus di atas /:id
router.get('/filter', filterVouchers);

// GET /api/vouchers - Ambil semua voucher
router.get('/', getAllVouchers);

// GET /api/vouchers/:id - Ambil detail 1 voucher
router.get('/:id', getVoucherById);

// POST /api/vouchers - Tambah voucher baru
router.post('/', createVoucher);

// PUT /api/vouchers/:id - Update voucher
router.put('/:id', updateVoucher);

// DELETE /api/vouchers/:id - Hapus voucher
router.delete('/:id', deleteVoucher);

export default router;
