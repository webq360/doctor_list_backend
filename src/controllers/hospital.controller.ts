import { Request, Response } from 'express';
import { z } from 'zod';
import Hospital from '../models/hospital.model';
import Doctor from '../models/doctor.model';
import Ambulance from '../models/ambulance.model';
import HospitalService from '../models/hospital_service.model';
import { getDistance } from '../utils/distance.util';

const hospitalSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  division: z.string().optional(),
  district: z.string().optional(),
  upazila: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  contact: z.string().min(5),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
});

export const createHospital = async (req: Request, res: Response) => {
  try {
    const parsed = hospitalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const hospital = await Hospital.create(parsed.data);
    res.status(201).json(hospital);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllHospitals = async (req: Request, res: Response) => {
  const hospitals = await Hospital.find().populate('doctors');
  res.json(hospitals);
};

export const getHospitalById = async (req: Request, res: Response) => {
  const hospital = await Hospital.findById(req.params.id).populate({
    path: 'doctors',
    populate: { path: 'userId', select: 'name' },
  });
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
  res.json(hospital);
};

export const getNearestHospitals = async (req: Request, res: Response) => {
  const { lat, lng, radius = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });

  const hospitals = await Hospital.find({ 'location.lat': { $exists: true }, 'location.lng': { $exists: true } });
  const nearby = hospitals
    .filter((h) => h.location?.lat != null && h.location?.lng != null)
    .map((h) => ({
      ...h.toObject(),
      distance: getDistance(Number(lat), Number(lng), h.location!.lat as number, h.location!.lng as number),
    }))
    .filter((h) => h.distance <= Number(radius))
    .sort((a, b) => a.distance - b.distance);

  res.json(nearby);
};

export const updateHospital = async (req: Request, res: Response) => {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
  res.json(hospital);
};

export const deleteHospital = async (req: Request, res: Response) => {
  await Hospital.findByIdAndDelete(req.params.id);
  res.json({ message: 'Hospital deleted' });
};

// --- Doctors ---
export const getHospitalDoctors = async (req: Request, res: Response) => {
  const doctors = await Doctor.find({ hospitalId: req.params.id }).populate('userId', 'name email phone');
  res.json(doctors);
};

export const addDoctorToHospital = async (req: Request, res: Response) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ message: 'doctorId required' });
  const doctor = await Doctor.findByIdAndUpdate(doctorId, { hospitalId: req.params.id }, { new: true }).populate('userId', 'name email phone');
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
};

export const removeDoctorFromHospital = async (req: Request, res: Response) => {
  await Doctor.findByIdAndUpdate(req.params.doctorId, { $unset: { hospitalId: 1 } });
  res.json({ message: 'Doctor removed' });
};

// --- Ambulances ---
export const getHospitalAmbulances = async (req: Request, res: Response) => {
  const ambulances = await Ambulance.find({ hospitalId: req.params.id });
  res.json(ambulances);
};

export const addAmbulanceToHospital = async (req: Request, res: Response) => {
  const { ambulanceId } = req.body;
  if (!ambulanceId) return res.status(400).json({ message: 'ambulanceId required' });
  const ambulance = await Ambulance.findByIdAndUpdate(ambulanceId, { hospitalId: req.params.id }, { new: true });
  if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
  res.json(ambulance);
};

export const removeAmbulanceFromHospital = async (req: Request, res: Response) => {
  await Ambulance.findByIdAndUpdate(req.params.ambulanceId, { $unset: { hospitalId: 1 } });
  res.json({ message: 'Ambulance removed' });
};

// --- Services ---
export const getHospitalServices = async (req: Request, res: Response) => {
  const services = await HospitalService.find({ hospitalId: req.params.id })
    .populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
  res.json(services);
};

export const addHospitalService = async (req: Request, res: Response) => {
  const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const service = await HospitalService.create({
    hospitalId: req.params.id,
    name,
    shortTitle,
    about,
    whatWeOffer: Array.isArray(whatWeOffer) ? whatWeOffer.filter(Boolean) : [],
    availableDoctors: Array.isArray(availableDoctors) ? availableDoctors : [],
    iconUrl,
  });
  const populated = await service.populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
  res.status(201).json(populated);
};

export const removeHospitalService = async (req: Request, res: Response) => {
  await HospitalService.findByIdAndDelete(req.params.serviceId);
  res.json({ message: 'Service removed' });
};
