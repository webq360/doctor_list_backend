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
  contactPersons: z.array(z.object({
    name: z.string().min(1),
    designation: z.string().min(1),
    mobile: z.string().min(1),
    whatsapp: z.string().optional(),
    isPublished: z.boolean().optional(),
    isForPatient: z.boolean().optional(),
    isForDoctorList: z.boolean().optional(),
  })).optional(),
  status: z.enum(['active', 'paused']).optional(),
  showInHome: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  callActive: z.boolean().optional(),
  bookAppointmentActive: z.boolean().optional(),
  // Legacy fields for backward compatibility
  contactPersonName: z.string().optional(),
  contactPersonDesignation: z.string().optional(),
  contactMobile: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  contact: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
});

export const createHospital = async (req: Request, res: Response) => {
  try {
    const parsed = hospitalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    
    // Validate location is provided
    if (!parsed.data.division || !parsed.data.district || !parsed.data.upazila) {
      return res.status(400).json({ message: 'Location (division, district, upazila) is required' });
    }
    
    const hospital = await Hospital.create(parsed.data);
    res.status(201).json(hospital);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllHospitals = async (req: Request, res: Response) => {
  const { name, division, district, upazila, includeInactive, isPopular } = req.query;
  const filter: Record<string, unknown> = {};

  // By default, only show active hospitals (for mobile app)
  // Admin can pass includeInactive=true to see all
  if (includeInactive !== 'true') {
    filter['status'] = 'active';
  }

  if (isPopular === 'true') {
    filter['isPopular'] = true;
  }

  // If location filter is provided, match against location fields
  if (division || district || upazila) {
    console.log('📍 Hospital Location filter requested:', { division, district, upazila });
    console.log('📍 isPopular:', isPopular);
    
    // Build location match conditions - ALL must match (AND logic)
    const locationConditions: any[] = [];
    
    if (division) {
      locationConditions.push({ 'division': { $regex: division as string, $options: 'i' } });
    }
    if (district) {
      locationConditions.push({ 'district': { $regex: district as string, $options: 'i' } });
    }
    if (upazila) {
      locationConditions.push({ 'upazila': { $regex: upazila as string, $options: 'i' } });
    }

    // Only add fallback for hospitals with no location if NOT filtering by popular
    // If isPopular is true, we want ONLY hospitals with matching location
    const orConditions: any[] = [];
    
    if (locationConditions.length > 0) {
      orConditions.push({ $and: locationConditions });
    }
    
    if (isPopular !== 'true') {
      console.log('📍 Adding fallback for hospitals with no location data');
      orConditions.push({ 
        division: { $exists: false },
        district: { $exists: false },
        upazila: { $exists: false }
      });
      orConditions.push({ 
        division: null,
        district: null,
        upazila: null
      });
      orConditions.push({ 
        division: '',
        district: '',
        upazila: ''
      });
    }
    
    if (orConditions.length > 0) {
      filter['$or'] = orConditions;
    }
    
    console.log('📍 Hospital location filter query:', JSON.stringify(filter, null, 2));
  }

  if (name) filter['name'] = new RegExp(name as string, 'i');

  const hospitals = await Hospital.find(filter);
  console.log('✅ Hospitals found:', hospitals.length);
  
  // Log first hospital's location for debugging
  if (hospitals.length > 0) {
    console.log('📍 First hospital location:', {
      division: hospitals[0].division,
      district: hospitals[0].district,
      upazila: hospitals[0].upazila,
      isPopular: hospitals[0].isPopular
    });
  }

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
  try {
    // Validate location is provided if being updated
    if (req.body.division !== undefined || req.body.district !== undefined || req.body.upazila !== undefined) {
      if (!req.body.division || !req.body.district || !req.body.upazila) {
        return res.status(400).json({ message: 'Location (division, district, upazila) must all be provided together' });
      }
    }
    
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleHospitalStatus = async (req: Request, res: Response) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    
    hospital.status = hospital.status === 'active' ? 'paused' : 'active';
    await hospital.save();
    res.json(hospital);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleShowInHome = async (req: Request, res: Response) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    
    hospital.showInHome = !hospital.showInHome;
    await hospital.save();
    res.json(hospital);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const togglePopularHospital = async (req: Request, res: Response) => {
  try {
    const { isPopular } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isPopular },
      { new: true }
    );
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json({ message: 'Hospital popular status updated', hospital });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
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
  const { ambulanceId, userId, hospitalAmbulanceUserId } = req.body;
  if (!ambulanceId && !userId && !hospitalAmbulanceUserId) {
    return res.status(400).json({ message: 'ambulanceId, userId, or hospitalAmbulanceUserId required' });
  }

  try {
    let updateData: any = { 
      hospitalId: req.params.id,
      type: 'hospital' // Set type to hospital
    };

    // If hospitalAmbulanceUserId is provided, find the ambulance associated with that user
    if (hospitalAmbulanceUserId && !ambulanceId && !userId) {
      const ambulance = await Ambulance.findOne({ hospitalAmbulanceUserId });
      if (!ambulance) {
        return res.status(404).json({ message: 'No ambulance found for this user' });
      }
      const updatedAmbulance = await Ambulance.findByIdAndUpdate(ambulance._id, updateData, { new: true });
      return res.json(updatedAmbulance);
    }

    // If userId is provided, find the ambulance associated with that user
    if (userId && !ambulanceId && !hospitalAmbulanceUserId) {
      const ambulance = await Ambulance.findOne({ userId });
      if (!ambulance) {
        return res.status(404).json({ message: 'No ambulance found for this user' });
      }
      const updatedAmbulance = await Ambulance.findByIdAndUpdate(ambulance._id, updateData, { new: true });
      return res.json(updatedAmbulance);
    }

    // If ambulanceId is provided, use it directly
    const ambulance = await Ambulance.findByIdAndUpdate(ambulanceId, updateData, { new: true });
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
    res.json(ambulance);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
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
