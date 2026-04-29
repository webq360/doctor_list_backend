import { Router } from 'express';
import {
  createHospital, getAllHospitals, getHospitalById, getNearestHospitals, updateHospital, deleteHospital,
  toggleHospitalStatus, toggleShowInHome, togglePopularHospital,
  getHospitalDoctors, addDoctorToHospital, removeDoctorFromHospital,
  setDoctorHospitalSchedule, getDoctorHospitalSchedule,
  getHospitalAmbulances, addAmbulanceToHospital, removeAmbulanceFromHospital,
  getHospitalServices, addHospitalService, removeHospitalService, updateHospitalService,
} from '../controllers/hospital.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllHospitals);
router.get('/nearest', getNearestHospitals);
router.post('/', protect, authorize('admin'), createHospital);

// Specific routes before :id routes
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleHospitalStatus);
router.patch('/:id/toggle-show-in-home', protect, authorize('admin'), toggleShowInHome);
router.patch('/:id/popular', protect, authorize('admin'), togglePopularHospital);

// General :id routes
router.get('/:id', getHospitalById);
router.put('/:id', protect, authorize('admin'), updateHospital);
router.delete('/:id', protect, authorize('admin'), deleteHospital);

// Doctors
router.get('/:id/doctors', getHospitalDoctors);
router.post('/:id/doctors', protect, authorize('admin'), addDoctorToHospital);
router.delete('/:id/doctors/:doctorId', protect, authorize('admin'), removeDoctorFromHospital);

// Doctor hospital-specific schedule
router.get('/:id/doctors/:doctorId/schedule', getDoctorHospitalSchedule);
router.put('/:id/doctors/:doctorId/schedule', protect, authorize('admin'), setDoctorHospitalSchedule);

// Ambulances
router.get('/:id/ambulances', getHospitalAmbulances);
router.post('/:id/ambulances', protect, authorize('admin'), addAmbulanceToHospital);
router.delete('/:id/ambulances/:ambulanceId', protect, authorize('admin'), removeAmbulanceFromHospital);

// Services
router.get('/:id/services', getHospitalServices);
router.post('/:id/services', protect, authorize('admin'), addHospitalService);
router.put('/:id/services/:serviceId', protect, authorize('admin'), updateHospitalService);
router.delete('/:id/services/:serviceId', protect, authorize('admin'), removeHospitalService);

export default router;
