import express from 'express';
import {
  getAllOperators,
  createOperator,
  updateOperator,
  deleteOperator
} from '../controllers/operatorController.js';

const router = express.Router();

// GET /api/operators - Get all operators
router.get('/', getAllOperators);

// POST /api/operators - Create new operator
router.post('/', createOperator);

// PUT /api/operators/:id - Update operator
router.put('/:id', updateOperator);

// DELETE /api/operators/:id - Delete operator (soft delete)
router.delete('/:id', deleteOperator);

export default router;