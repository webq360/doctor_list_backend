import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAllAppointments,
} from '../controllers/appointment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.post('/', authorize('patient'), bookAppointment);
router.get('/', getMyAppointments);
router.get('/all', authorize('admin'), getAllAppointments);
router.get('/doctor/:doctorId', authorize('doctor', 'admin'), getDoctorAppointments);
router.patch('/:id/status', authorize('doctor', 'admin'), updateAppointmentStatus);

export default router;
