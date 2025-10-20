import express from 'express';
import {
  getAllWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletSummary
} from '../controllers/walletController.js';

const router = express.Router();

// GET /api/wallets/summary - harus di atas /:id
router.get('/summary', getWalletSummary);

// GET /api/wallets - Ambil semua wallet
router.get('/', getAllWallets);

// GET /api/wallets/:id - Ambil detail wallet
router.get('/:id', getWalletById);

// POST /api/wallets - Tambah wallet baru
router.post('/', createWallet);

// PUT /api/wallets/:id - Update wallet
router.put('/:id', updateWallet);

// DELETE /api/wallets/:id - Hapus wallet
router.delete('/:id', deleteWallet);

export default router;
