import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAllAppointments,
  getDoctorHospitalSchedule,
} from '../controllers/appointment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: get doctor schedule at a specific hospital
router.get('/schedule/:doctorId/:hospitalId', getDoctorHospitalSchedule);

router.use(protect);
router.post('/', authorize('patient'), bookAppointment);
router.get('/', getMyAppointments);
router.get('/all', authorize('admin'), getAllAppointments);
router.get('/doctor/:doctorId', authorize('doctor', 'admin'), getDoctorAppointments);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
