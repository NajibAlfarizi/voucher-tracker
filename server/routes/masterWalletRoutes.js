import express from 'express';
import {
  getAllMasterWallets,
  getMasterWalletById,
  createMasterWallet,
  updateMasterWallet,
  deleteMasterWallet,
  getAllWalletTransactions,
  createWalletTransaction,
  deleteWalletTransaction,
  getWalletStatistics
} from '../controllers/masterWalletController.js';

const router = express.Router();

// Master Wallet Routes
router.get('/master', getAllMasterWallets);
router.get('/master/:id', getMasterWalletById);
router.post('/master', createMasterWallet);
router.put('/master/:id', updateMasterWallet);
router.delete('/master/:id', deleteMasterWallet);

// Transaction Routes
router.get('/transactions', getAllWalletTransactions);
router.post('/transactions', createWalletTransaction);
router.delete('/transactions/:id', deleteWalletTransaction);

// Statistics
router.get('/statistics', getWalletStatistics);

export default router;
