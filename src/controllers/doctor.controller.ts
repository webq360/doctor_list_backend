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
  const { specialization } = req.query;
  const filter: Record<string, unknown> = { isApproved: true };
  if (specialization) filter.specialization = new RegExp(specialization as string, 'i');

  const doctors = await Doctor.find(filter).populate('userId', 'name email phone').populate('hospitalId', 'name address');
  res.json(doctors);
};

export const getDoctorById = async (req: Request, res: Response) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('hospitalId', 'name address');
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
    const { name, email, phone, password, specializations, experience, fees, bio, hospitalId, profileImage, location, schedule } = req.body;
    if (!name || !email || !phone || !password || !fees) {
      return res.status(400).json({ message: 'name, email, phone, password, fees are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, role: 'doctor' });
    const doctor = await Doctor.create({
      userId: user._id,
      specializations: Array.isArray(specializations) ? specializations : (specializations ? [specializations] : []),
      experience: Number(experience) || 0,
      fees: Number(fees),
      bio,
      hospitalId: hospitalId || undefined,
      profileImage,
      location,
      schedule: schedule || [],
      isApproved: true,
    });
    const populated = await Doctor.findById(doctor._id).populate('userId', 'name email phone').populate('hospitalId', 'name');
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
