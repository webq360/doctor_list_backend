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
  const { name, division, district, upazila } = req.query;
  const filter: Record<string, unknown> = {};

  if (division) filter['division'] = new RegExp(division as string, 'i');
  if (district) filter['district'] = new RegExp(district as string, 'i');
  if (upazila) filter['upazila'] = new RegExp(upazila as string, 'i');
  if (name) filter['name'] = new RegExp(name as string, 'i');

  const hospitals = await Hospital.find(filter);
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
  // Find doctors assigned to this hospital (either via hospitalId or hospitalIds array)
  const doctors = await Doctor.find({
    $or: [{ hospitalId: req.params.id }, { hospitalIds: req.params.id }]
  }).populate('userId', 'name email phone');
  res.json(doctors);
};

export const addDoctorToHospital = async (req: Request, res: Response) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ message: 'doctorId required' });
  // Add to hospitalIds array (multi-hospital support) and keep hospitalId for backward compat
  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    {
      $addToSet: { hospitalIds: req.params.id },
      $set: { hospitalId: req.params.id },
    },
    { new: true }
  ).populate('userId', 'name email phone');
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
};

export const removeDoctorFromHospital = async (req: Request, res: Response) => {
  await Doctor.findByIdAndUpdate(req.params.doctorId, {
    $pull: { hospitalIds: req.params.id },
    $unset: { hospitalId: 1 },
  });
  res.json({ message: 'Doctor removed' });
};

// Set hospital-specific schedule for a doctor
export const setDoctorHospitalSchedule = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { schedule } = req.body; // array of { day, startTime, endTime }
  if (!Array.isArray(schedule)) return res.status(400).json({ message: 'schedule array required' });

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  // Update or insert hospital-specific schedule
  const existingIdx = doctor.hospitalSchedules?.findIndex(
    (hs: any) => hs.hospitalId.toString() === req.params.id
  ) ?? -1;

  if (existingIdx >= 0) {
    doctor.hospitalSchedules[existingIdx].schedule = schedule;
  } else {
    if (!doctor.hospitalSchedules) doctor.hospitalSchedules = [];
    doctor.hospitalSchedules.push({ hospitalId: req.params.id as any, schedule });
  }

  await doctor.save();
  res.json({ message: 'Schedule updated', schedule });
};

// Get hospital-specific schedule for a doctor
export const getDoctorHospitalSchedule = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const hospitalSchedule = doctor.hospitalSchedules?.find(
    (hs: any) => hs.hospitalId.toString() === req.params.id
  );
  const schedule = (hospitalSchedule?.schedule?.length ?? 0) > 0
    ? hospitalSchedule!.schedule
    : doctor.schedule;

  res.json({ schedule, fees: doctor.fees });
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
  const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl, imageUrl, serviceImageUrl, ourService } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const service = await HospitalService.create({
    hospitalId: req.params.id,
    name,
    shortTitle,
    about,
    ourService,
    whatWeOffer: Array.isArray(whatWeOffer) ? whatWeOffer.filter(Boolean) : [],
    availableDoctors: Array.isArray(availableDoctors) ? availableDoctors : [],
    iconUrl,
    imageUrl,
    serviceImageUrl,
  });
  const populated = await service.populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
  res.status(201).json(populated);
};

export const updateHospitalService = async (req: Request, res: Response) => {
  const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl, imageUrl, serviceImageUrl, ourService } = req.body;
  const service = await HospitalService.findByIdAndUpdate(
    req.params.serviceId,
    { name, shortTitle, about, ourService, whatWeOffer, availableDoctors, iconUrl, imageUrl, serviceImageUrl },
    { new: true }
  ).populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
};

export const removeHospitalService = async (req: Request, res: Response) => {
  await HospitalService.findByIdAndDelete(req.params.serviceId);
  res.json({ message: 'Service removed' });
};
