import { Router } from 'express';
import {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  approveDoctor,
  togglePopularDoctor,
  adminCreateDoctor,
  deleteDoctor,
} from '../controllers/doctor.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllDoctors);
router.get('/all', protect, authorize('admin'), async (req, res) => {
  const Doctor = require('../models/doctor.model').default;
  const doctors = await Doctor.find()
    .populate('userId', 'name email phone')
    .populate('hospitalId', 'name')
    .populate('hospitalIds', 'name address division district upazila')
    .populate('departments', 'title description');
  res.json(doctors);
});
router.get('/:id', getDoctorById);
router.post('/profile', protect, authorize('doctor'), createDoctorProfile);
router.post('/admin/create', protect, authorize('admin'), adminCreateDoctor);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);
router.patch('/:id/approve', protect, authorize('admin'), approveDoctor);
router.patch('/:id/popular', protect, authorize('admin'), togglePopularDoctor);
router.put('/:id', protect, authorize('admin'), async (req: any, res: any) => {
  try {
    const Doctor = require('../models/doctor.model').default;
    const User = require('../models/user.model').default;
    const Hospital = require('../models/hospital.model').default;
    const { userName, userPhone, newPassword, ...doctorFields } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    // Special handling for bmdcNumber - check for duplicates if being updated
    if (doctorFields.bmdcNumber !== undefined) {
      const trimmedBmdc = doctorFields.bmdcNumber?.trim();
      if (trimmedBmdc) {
        // Check if another doctor has this BMDC number
        const existingDoctor = await Doctor.findOne({ 
          bmdcNumber: trimmedBmdc, 
          _id: { $ne: req.params.id } 
        });
        if (existingDoctor) {
          return res.status(409).json({ message: 'BMDC number already exists' });
        }
        doctorFields.bmdcNumber = trimmedBmdc;
      } else {
        // If empty, set to undefined to remove it
        doctorFields.bmdcNumber = undefined;
      }
    }
    
    // Update location from primary hospital if hospitalIds changed
    if (doctorFields.hospitalIds && doctorFields.hospitalIds.length > 0) {
      const primaryHospital = await Hospital.findById(doctorFields.hospitalIds[0]);
      if (primaryHospital && (primaryHospital.division || primaryHospital.district || primaryHospital.upazila)) {
        doctorFields.location = {
          division: primaryHospital.division,
          district: primaryHospital.district,
          upazila: primaryHospital.upazila,
        };
      }
    }
    
    // Remove fields that are undefined or null (but keep empty strings for diseases fields)
    Object.keys(doctorFields).forEach(key => {
      // Allow empty strings for diseasesTitle and diseasesDescription
      if (key === 'diseasesTitle' || key === 'diseasesDescription') {
        return;
      }
      // Remove undefined, null, or empty strings for other fields
      if (doctorFields[key] === undefined || doctorFields[key] === null || doctorFields[key] === '') {
        delete doctorFields[key];
      }
    });
    
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
      .populate('userId', 'name email phone')
      .populate('hospitalId', 'name')
      .populate('hospitalIds', 'name address division district upazila')
      .populate('departments', 'title description');
    res.json(updated);
  } catch (err: any) { 
    console.error('Doctor update error:', err);
    res.status(500).json({ message: err.message }); 
  }
});
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

// Rate a doctor (any logged-in user)
router.post('/:id/rate', protect, async (req: any, res: any) => {
  try {
    const Doctor = require('../models/doctor.model').default;
    const Review = require('../models/review.model').default;
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    // Create review
    await Review.create({
      doctorId: req.params.id,
      userId: req.user.id,
      rating: Number(rating),
      comment: comment || '',
    });
    
    // Update doctor rating
    const newCount = doctor.ratingCount + 1;
    const newRating = ((doctor.rating * doctor.ratingCount) + Number(rating)) / newCount;
    doctor.rating = Math.round(newRating * 10) / 10;
    doctor.ratingCount = newCount;
    await doctor.save();
    res.json({ rating: doctor.rating, ratingCount: doctor.ratingCount });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get doctor reviews
router.get('/:id/reviews', async (req: any, res: any) => {
  try {
    const Review = require('../models/review.model').default;
    const reviews = await Review.find({ doctorId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
