import { Router } from 'express';
import { getAll, create, update, remove } from '../controllers/blood_bank.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAll);
router.post('/', protect, authorize('admin'), create);
router.put('/:id', protect, authorize('admin'), update);
router.delete('/:id', protect, authorize('admin'), remove);

export default router;
