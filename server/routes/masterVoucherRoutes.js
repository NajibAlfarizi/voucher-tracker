import express from 'express';
import {
  getAllMasterVouchers,
  getMasterVoucherById,
  createMasterVoucher,
  updateMasterVoucher,
  deleteMasterVoucher,
  getAllVoucherTransactions,
  createVoucherTransaction,
  deleteVoucherTransaction,
  getVoucherStatistics
} from '../controllers/masterVoucherController.js';

const router = express.Router();

// Master Voucher Routes
router.get('/master', getAllMasterVouchers);
router.get('/master/:id', getMasterVoucherById);
router.post('/master', createMasterVoucher);
router.put('/master/:id', updateMasterVoucher);
router.delete('/master/:id', deleteMasterVoucher);

// Transaction Routes
router.get('/transactions', getAllVoucherTransactions);
router.post('/transactions', createVoucherTransaction);
router.delete('/transactions/:id', deleteVoucherTransaction);

// Statistics
router.get('/statistics', getVoucherStatistics);

export default router;
