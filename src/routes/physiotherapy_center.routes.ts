import { Router } from 'express';
import {
  createCenter, getAllCenters, getCenterById, getNearestCenters, updateCenter, deleteCenter,
  getCenterDoctors, addDoctorToCenter, removeDoctorFromCenter,
  getCenterAmbulances, addAmbulanceToCenter, removeAmbulanceFromCenter,
  getCenterServices, addCenterService, removeCenterService,
} from '../controllers/physiotherapy_center.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllCenters);
router.get('/nearest', getNearestCenters);
router.get('/:id', getCenterById);
router.post('/', protect, authorize('admin'), createCenter);
router.put('/:id', protect, authorize('admin'), updateCenter);
router.delete('/:id', protect, authorize('admin'), deleteCenter);

// Doctors
router.get('/:id/doctors', getCenterDoctors);
router.post('/:id/doctors', protect, authorize('admin'), addDoctorToCenter);
router.delete('/:id/doctors/:doctorId', protect, authorize('admin'), removeDoctorFromCenter);

// Ambulances
router.get('/:id/ambulances', getCenterAmbulances);
router.post('/:id/ambulances', protect, authorize('admin'), addAmbulanceToCenter);
router.delete('/:id/ambulances/:ambulanceId', protect, authorize('admin'), removeAmbulanceFromCenter);

// Services
router.get('/:id/services', getCenterServices);
router.post('/:id/services', protect, authorize('admin'), addCenterService);
router.delete('/:id/services/:serviceId', protect, authorize('admin'), removeCenterService);

export default router;
