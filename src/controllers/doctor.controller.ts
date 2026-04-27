import { Request, Response } from 'express';
import { z } from 'zod';
import Doctor from '../models/doctor.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';

const doctorSchema = z.object({
  specialization: z.string().min(2),
  experience: z.number().min(0),
  hospitalId: z.string().optional(),
  schedule: z.array(z.object({ day: z.string(), startTime: z.string(), endTime: z.string() })),
  fees: z.number().min(0),
  bio: z.string().optional(),
});

export const createDoctorProfile = async (req: AuthRequest, res: Response) => {
  const parsed = doctorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const existing = await Doctor.findOne({ userId: req.user!.id });
  if (existing) return res.status(409).json({ message: 'Profile already exists' });

  const doctor = await Doctor.create({ ...parsed.data, userId: req.user!.id });
  res.status(201).json(doctor);
};

export const getAllDoctors = async (req: Request, res: Response) => {
  const { name, specialization, division, district, upazila } = req.query;
  const filter: Record<string, unknown> = { isApproved: true };

  if (specialization) filter['specializations'] = { $elemMatch: { $regex: specialization as string, $options: 'i' } };
  if (division) filter['location.division'] = new RegExp(division as string, 'i');
  if (district) filter['location.district'] = new RegExp(district as string, 'i');
  if (upazila) filter['location.upazila'] = new RegExp(upazila as string, 'i');

  let doctors = await Doctor.find(filter)
    .populate('userId', 'name email phone')
    .populate('hospitalId', 'name address logo')
    .populate('hospitalIds', 'name address division district upazila')
    .populate('departments', 'title description');

  // Filter by name (from populated userId)
  if (name) {
    const n = (name as string).toLowerCase();
    doctors = doctors.filter((d: any) => d.userId?.name?.toLowerCase().includes(n));
  }

  res.json(doctors);
};

export const getDoctorById = async (req: Request, res: Response) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('hospitalId', 'name address')
    .populate('hospitalIds', 'name address division district upazila')
    .populate('departments', 'title description');
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
};

export const updateDoctorProfile = async (req: AuthRequest, res: Response) => {
  const doctor = await Doctor.findOneAndUpdate({ userId: req.user!.id }, req.body, { new: true });
  if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
  res.json(doctor);
};

export const approveDoctor = async (req: Request, res: Response) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json({ message: 'Doctor approved', doctor });
};

export const adminCreateDoctor = async (req: Request, res: Response) => {
  try {
    const { name, phone, bmdcNumber, specializations, departments, experience, fees, bio, hospitalIds, profileImage } = req.body;
    if (!name || !fees) {
      return res.status(400).json({ message: 'name and fees are required' });
    }
    
    // Check if BMDC number already exists (only if provided)
    if (bmdcNumber) {
      const existingBmdc = await Doctor.findOne({ bmdcNumber });
      if (existingBmdc) {
        return res.status(409).json({ message: 'BMDC number already exists' });
      }
    }
    
    // Check if user with this phone already exists (only if phone provided)
    let user;
    if (phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        // If user exists, check if they already have a doctor profile
        const existingDoctor = await Doctor.findOne({ userId: existingUser._id });
        if (existingDoctor) {
          return res.status(409).json({ message: 'Doctor profile already exists for this phone number' });
        }
        user = existingUser;
      } else {
        // Create new user with phone as email and a default password
        const email = `${phone}@doctor.temp`;
        const defaultPassword = phone; // Use phone as default password
        user = await User.create({ name, email, phone, password: defaultPassword, role: 'doctor' });
      }
    } else {
      // Create user without phone - use name-based email
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@doctor.temp`;
      const defaultPassword = 'doctor123'; // Default password when no phone
      user = await User.create({ name, email, password: defaultPassword, role: 'doctor' });
    }

    // Get location from primary hospital if hospitals are selected
    let location;
    if (hospitalIds && hospitalIds.length > 0) {
      const Hospital = require('../models/hospital.model').default;
      const primaryHospital = await Hospital.findById(hospitalIds[0]);
      if (primaryHospital && (primaryHospital.division || primaryHospital.district || primaryHospital.upazila)) {
        location = {
          division: primaryHospital.division,
          district: primaryHospital.district,
          upazila: primaryHospital.upazila,
        };
      }
    }

    const doctor = await Doctor.create({
      userId: user._id,
      bmdcNumber: bmdcNumber || undefined,
      specializations: Array.isArray(specializations) ? specializations : (specializations ? [specializations] : []),
      departments: departments || [],
      experience: Number(experience) || 0,
      fees: Number(fees),
      bio,
      hospitalIds: hospitalIds || [],
      hospitalId: hospitalIds?.[0] || undefined, // Set first hospital as primary
      profileImage,
      location,
      schedule: [], // No schedule on creation
      isApproved: true,
    });

    // Add doctor to hospitals
    if (hospitalIds && hospitalIds.length > 0) {
      const Hospital = require('../models/hospital.model').default;
      await Hospital.updateMany(
        { _id: { $in: hospitalIds } },
        { $addToSet: { doctors: doctor._id } }
      );
    }

    const populated = await Doctor.findById(doctor._id)
      .populate('userId', 'name email phone')
      .populate('hospitalIds', 'name')
      .populate('hospitalId', 'name')
      .populate('departments', 'title description');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
