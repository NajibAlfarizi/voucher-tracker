import express from 'express';
import {
  getAllWalletDailyStock,
  getWalletDailyStockById,
  createWalletDailyStock,
  updateWalletDailyStock,
  deleteWalletDailyStock,
  getWalletDailyStockByWallet
} from '../controllers/walletDailyStockController.js';

const router = express.Router();

router.get('/', getAllWalletDailyStock);
router.get('/:id', getWalletDailyStockById);
router.get('/by-wallet/:wallet_id', getWalletDailyStockByWallet);
router.post('/', createWalletDailyStock);
router.put('/:id', updateWalletDailyStock);
router.delete('/:id', deleteWalletDailyStock);

export default router;
