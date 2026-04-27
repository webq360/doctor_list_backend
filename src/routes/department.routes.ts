import { Router } from 'express';
import {
  getAllDepartments,
  getAllDepartmentsAdmin,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
} from '../controllers/department.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllDepartmentsAdmin);
router.post('/', protect, authorize('admin'), createDepartment);
router.put('/:id', protect, authorize('admin'), updateDepartment);
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleDepartmentStatus);
router.delete('/:id', protect, authorize('admin'), deleteDepartment);

export default router;