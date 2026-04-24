import { Request, Response } from 'express';
import PhysiotherapyCenter from '../models/physiotherapy_center.model';
import PhysiotherapyService from '../models/physiotherapy_service.model';
import Doctor from '../models/doctor.model';
import Ambulance from '../models/ambulance.model';
import { getDistance } from '../utils/distance.util';

export const createCenter = async (req: Request, res: Response) => {
  try {
    const { name, address, division, district, upazila, contact, logo, coverImage, location } = req.body;
    if (!name || !address || !contact) return res.status(400).json({ message: 'name, address and contact are required' });
    const center = await PhysiotherapyCenter.create({
      name, address, contact,
      division: division || undefined,
      district: district || undefined,
      upazila: upazila || undefined,
      logo: logo || undefined,
      coverImage: coverImage || undefined,
      location: location?.lat && location?.lng ? { lat: Number(location.lat), lng: Number(location.lng) } : undefined,
    });
    res.status(201).json(center);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCenters = async (req: Request, res: Response) => {
  const centers = await PhysiotherapyCenter.find();
  res.json(centers);
};

export const getCenterById = async (req: Request, res: Response) => {
  const center = await PhysiotherapyCenter.findById(req.params.id);
  if (!center) return res.status(404).json({ message: 'Center not found' });
  res.json(center);
};

export const getNearestCenters = async (req: Request, res: Response) => {
  const { lat, lng, radius = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });
  const centers = await PhysiotherapyCenter.find({ 'location.lat': { $exists: true } });
  const nearby = centers
    .filter((c) => c.location?.lat != null && c.location?.lng != null)
    .map((c) => ({
      ...c.toObject(),
      distance: getDistance(Number(lat), Number(lng), c.location!.lat as number, c.location!.lng as number),
    }))
    .filter((c) => c.distance <= Number(radius))
    .sort((a, b) => a.distance - b.distance);
  res.json(nearby);
};

export const updateCenter = async (req: Request, res: Response) => {
  const center = await PhysiotherapyCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!center) return res.status(404).json({ message: 'Center not found' });
  res.json(center);
};

export const deleteCenter = async (req: Request, res: Response) => {
  await PhysiotherapyCenter.findByIdAndDelete(req.params.id);
  res.json({ message: 'Center deleted' });
};

// --- Doctors ---
export const getCenterDoctors = async (req: Request, res: Response) => {
  const doctors = await Doctor.find({ physiotherapyCenterId: req.params.id }).populate('userId', 'name email phone');
  res.json(doctors);
};

export const addDoctorToCenter = async (req: Request, res: Response) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ message: 'doctorId required' });
  const doctor = await Doctor.findByIdAndUpdate(doctorId, { physiotherapyCenterId: req.params.id }, { new: true }).populate('userId', 'name email phone');
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
};

export const removeDoctorFromCenter = async (req: Request, res: Response) => {
  await Doctor.findByIdAndUpdate(req.params.doctorId, { $unset: { physiotherapyCenterId: 1 } });
  res.json({ message: 'Doctor removed' });
};

// --- Ambulances ---
export const getCenterAmbulances = async (req: Request, res: Response) => {
  const ambulances = await Ambulance.find({ physiotherapyCenterId: req.params.id });
  res.json(ambulances);
};

export const addAmbulanceToCenter = async (req: Request, res: Response) => {
  const { ambulanceId } = req.body;
  if (!ambulanceId) return res.status(400).json({ message: 'ambulanceId required' });
  const ambulance = await Ambulance.findByIdAndUpdate(ambulanceId, { physiotherapyCenterId: req.params.id }, { new: true });
  if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
  res.json(ambulance);
};

export const removeAmbulanceFromCenter = async (req: Request, res: Response) => {
  await Ambulance.findByIdAndUpdate(req.params.ambulanceId, { $unset: { physiotherapyCenterId: 1 } });
  res.json({ message: 'Ambulance removed' });
};

// --- Services ---
export const getCenterServices = async (req: Request, res: Response) => {
  const services = await PhysiotherapyService.find({ centerId: req.params.id })
    .populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
  res.json(services);
};

export const addCenterService = async (req: Request, res: Response) => {
  const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const service = await PhysiotherapyService.create({
    centerId: req.params.id,
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

export const removeCenterService = async (req: Request, res: Response) => {
  await PhysiotherapyService.findByIdAndDelete(req.params.serviceId);
  res.json({ message: 'Service removed' });
};
