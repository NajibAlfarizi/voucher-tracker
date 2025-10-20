import express from 'express';
import {
  getVoucherSummary,
  getWalletSummary,
  getDailyStatistics,
  getDashboardOverview
} from '../controllers/statisticsController.js';

const router = express.Router();

// GET /api/statistics/voucher-summary - Ringkasan voucher per operator
router.get('/voucher-summary', getVoucherSummary);

// GET /api/statistics/wallet-summary - Ringkasan total saldo e-wallet
router.get('/wallet-summary', getWalletSummary);

// GET /api/statistics/daily - Data gabungan voucher & wallet per tanggal
router.get('/daily', getDailyStatistics);

// GET /api/statistics/dashboard - Dashboard overview
router.get('/dashboard', getDashboardOverview);

export default router;
