import { Router } from 'express';
import {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  approveDoctor,
  adminCreateDoctor,
  deleteDoctor,
} from '../controllers/doctor.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllDoctors);
router.get('/all', protect, authorize('admin'), async (req, res) => {
  const Doctor = require('../models/doctor.model').default;
  const doctors = await Doctor.find().populate('userId', 'name email phone').populate('hospitalId', 'name');
  res.json(doctors);
});
router.get('/:id', getDoctorById);
router.post('/profile', protect, authorize('doctor'), createDoctorProfile);
router.post('/admin/create', protect, authorize('admin'), adminCreateDoctor);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);
router.patch('/:id/approve', protect, authorize('admin'), approveDoctor);
router.put('/:id', protect, authorize('admin'), async (req: any, res: any) => {
  try {
    const Doctor = require('../models/doctor.model').default;
    const User = require('../models/user.model').default;
    const { userName, userPhone, newPassword, ...doctorFields } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    // Update user info
    if (userName || userPhone || newPassword) {
      const userUpdate: any = {};
      if (userName) userUpdate.name = userName;
      if (userPhone) userUpdate.phone = userPhone;
      if (newPassword) userUpdate.password = newPassword;
      const user = await User.findById(doctor.userId);
      if (user) { Object.assign(user, userUpdate); await user.save(); }
    }
    const updated = await Doctor.findByIdAndUpdate(req.params.id, doctorFields, { new: true })
      .populate('userId', 'name email phone').populate('hospitalId', 'name');
    res.json(updated);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

export default router;
