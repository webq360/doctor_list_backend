import { Router } from 'express';
import HospitalAmbulanceUser from '../models/hospital_ambulance_user.model';

const router = Router();

// Get all hospital ambulance users
router.get('/', async (req, res) => {
  try {
    const users = await HospitalAmbulanceUser.find({ isActive: true }).select('name phone profileImage');
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create hospital ambulance user
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, profileImage } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const user = await HospitalAmbulanceUser.create({
      name,
      phone,
      email: email || `${phone}@ambulance.local`,
      profileImage,
      isActive: true,
    });

    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update hospital ambulance user
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, profileImage, isActive } = req.body;
    const user = await HospitalAmbulanceUser.findByIdAndUpdate(
      req.params.id,
      { name, phone, profileImage, isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete hospital ambulance user
router.delete('/:id', async (req, res) => {
  try {
    await HospitalAmbulanceUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
