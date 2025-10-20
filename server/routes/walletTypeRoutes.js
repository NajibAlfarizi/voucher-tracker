import express from 'express';
import {
  getAllWalletTypes,
  createWalletType,
  updateWalletType,
  deleteWalletType
} from '../controllers/walletTypeController.js';

const router = express.Router();

// GET /api/wallet-types - Get all wallet types
router.get('/', getAllWalletTypes);

// POST /api/wallet-types - Create new wallet type
router.post('/', createWalletType);

// PUT /api/wallet-types/:id - Update wallet type
router.put('/:id', updateWalletType);

// DELETE /api/wallet-types/:id - Delete wallet type (soft delete)
router.delete('/:id', deleteWalletType);

export default router;