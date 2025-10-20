import express from 'express';
import {
  getAllVoucherDailyStock,
  getVoucherDailyStockById,
  createVoucherDailyStock,
  updateVoucherDailyStock,
  deleteVoucherDailyStock,
  getVoucherDailyStockByVoucher
} from '../controllers/voucherDailyStockController.js';

const router = express.Router();

// GET /api/voucher-daily - List all daily voucher stock
router.get('/', getAllVoucherDailyStock);
// GET /api/voucher-daily/:id - Detail
router.get('/:id', getVoucherDailyStockById);
// GET /api/voucher-daily/by-voucher/:voucher_id - List by voucher
router.get('/by-voucher/:voucher_id', getVoucherDailyStockByVoucher);
// POST /api/voucher-daily - Input harian
router.post('/', createVoucherDailyStock);
// PUT /api/voucher-daily/:id - Update harian
router.put('/:id', updateVoucherDailyStock);
// DELETE /api/voucher-daily/:id - Hapus harian
router.delete('/:id', deleteVoucherDailyStock);

export default router;
