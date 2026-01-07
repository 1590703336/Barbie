import { Router } from 'express';
import { createConvertPair, getConvertPairs, updateConvertPair, deleteConvertPair } from './convertPair.controller.js';
import { createConvertPairSchema, updateConvertPairSchema } from './convertPair.validation.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authorize);

// GET /api/v1/convert-pairs - Get all pairs for current user
router.get('/', getConvertPairs);

// POST /api/v1/convert-pairs - Create new pair
router.post('/', validate(createConvertPairSchema), createConvertPair);

// PUT /api/v1/convert-pairs/:id - Update pair
router.put('/:id', validate(updateConvertPairSchema), updateConvertPair);

// DELETE /api/v1/convert-pairs/:id - Delete pair
router.delete('/:id', deleteConvertPair);

export default router;
