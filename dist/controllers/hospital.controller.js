"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeHospitalService = exports.updateHospitalService = exports.addHospitalService = exports.getHospitalServices = exports.removeAmbulanceFromHospital = exports.addAmbulanceToHospital = exports.getHospitalAmbulances = exports.getDoctorHospitalSchedule = exports.setDoctorHospitalSchedule = exports.removeDoctorFromHospital = exports.addDoctorToHospital = exports.getHospitalDoctors = exports.deleteHospital = exports.togglePopularHospital = exports.toggleShowInHome = exports.toggleHospitalStatus = exports.updateHospital = exports.getNearestHospitals = exports.getHospitalById = exports.getAllHospitals = exports.createHospital = void 0;
const zod_1 = require("zod");
const hospital_model_1 = __importDefault(require("../models/hospital.model"));
const doctor_model_1 = __importDefault(require("../models/doctor.model"));
const ambulance_model_1 = __importDefault(require("../models/ambulance.model"));
const hospital_service_model_1 = __importDefault(require("../models/hospital_service.model"));
const distance_util_1 = require("../utils/distance.util");
const hospitalSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    address: zod_1.z.string().min(3),
    division: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    upazila: zod_1.z.string().optional(),
    location: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }).optional(),
    contactPersons: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        designation: zod_1.z.string().min(1),
        mobile: zod_1.z.string().min(1),
        whatsapp: zod_1.z.string().optional(),
        isPublished: zod_1.z.boolean().optional(),
        isForPatient: zod_1.z.boolean().optional(),
        isForDoctorList: zod_1.z.boolean().optional(),
    })).optional(),
    status: zod_1.z.enum(['active', 'paused']).optional(),
    showInHome: zod_1.z.boolean().optional(),
    isPopular: zod_1.z.boolean().optional(),
    callActive: zod_1.z.boolean().optional(),
    bookAppointmentActive: zod_1.z.boolean().optional(),
    // Legacy fields for backward compatibility
    contactPersonName: zod_1.z.string().optional(),
    contactPersonDesignation: zod_1.z.string().optional(),
    contactMobile: zod_1.z.string().optional(),
    contactWhatsapp: zod_1.z.string().optional(),
    contact: zod_1.z.string().optional(),
    logo: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().optional(),
});
const createHospital = async (req, res) => {
    try {
        const parsed = hospitalSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ errors: parsed.error.flatten() });
        // Validate location is provided
        if (!parsed.data.division || !parsed.data.district || !parsed.data.upazila) {
            return res.status(400).json({ message: 'Location (division, district, upazila) is required' });
        }
        const hospital = await hospital_model_1.default.create(parsed.data);
        res.status(201).json(hospital);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createHospital = createHospital;
const getAllHospitals = async (req, res) => {
    const { name, division, district, upazila, includeInactive, isPopular } = req.query;
    const filter = {};
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
        const locationConditions = [];
        if (division) {
            locationConditions.push({ 'division': { $regex: division, $options: 'i' } });
        }
        if (district) {
            locationConditions.push({ 'district': { $regex: district, $options: 'i' } });
        }
        if (upazila) {
            locationConditions.push({ 'upazila': { $regex: upazila, $options: 'i' } });
        }
        // Only add fallback for hospitals with no location if NOT filtering by popular
        // If isPopular is true, we want ONLY hospitals with matching location
        const orConditions = [];
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
    if (name)
        filter['name'] = new RegExp(name, 'i');
    const hospitals = await hospital_model_1.default.find(filter);
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
exports.getAllHospitals = getAllHospitals;
const getHospitalById = async (req, res) => {
    const hospital = await hospital_model_1.default.findById(req.params.id).populate({
        path: 'doctors',
        populate: { path: 'userId', select: 'name' },
    });
    if (!hospital)
        return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
};
exports.getHospitalById = getHospitalById;
const getNearestHospitals = async (req, res) => {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng)
        return res.status(400).json({ message: 'lat and lng are required' });
    const hospitals = await hospital_model_1.default.find({ 'location.lat': { $exists: true }, 'location.lng': { $exists: true } });
    const nearby = hospitals
        .filter((h) => h.location?.lat != null && h.location?.lng != null)
        .map((h) => ({
        ...h.toObject(),
        distance: (0, distance_util_1.getDistance)(Number(lat), Number(lng), h.location.lat, h.location.lng),
    }))
        .filter((h) => h.distance <= Number(radius))
        .sort((a, b) => a.distance - b.distance);
    res.json(nearby);
};
exports.getNearestHospitals = getNearestHospitals;
const updateHospital = async (req, res) => {
    try {
        // Validate location is provided if being updated
        if (req.body.division !== undefined || req.body.district !== undefined || req.body.upazila !== undefined) {
            if (!req.body.division || !req.body.district || !req.body.upazila) {
                return res.status(400).json({ message: 'Location (division, district, upazila) must all be provided together' });
            }
        }
        const hospital = await hospital_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hospital)
            return res.status(404).json({ message: 'Hospital not found' });
        res.json(hospital);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateHospital = updateHospital;
const toggleHospitalStatus = async (req, res) => {
    try {
        const hospital = await hospital_model_1.default.findById(req.params.id);
        if (!hospital)
            return res.status(404).json({ message: 'Hospital not found' });
        hospital.status = hospital.status === 'active' ? 'paused' : 'active';
        await hospital.save();
        res.json(hospital);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.toggleHospitalStatus = toggleHospitalStatus;
const toggleShowInHome = async (req, res) => {
    try {
        const hospital = await hospital_model_1.default.findById(req.params.id);
        if (!hospital)
            return res.status(404).json({ message: 'Hospital not found' });
        hospital.showInHome = !hospital.showInHome;
        await hospital.save();
        res.json(hospital);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.toggleShowInHome = toggleShowInHome;
const togglePopularHospital = async (req, res) => {
    try {
        const { isPopular } = req.body;
        const hospital = await hospital_model_1.default.findByIdAndUpdate(req.params.id, { isPopular }, { new: true });
        if (!hospital)
            return res.status(404).json({ message: 'Hospital not found' });
        res.json({ message: 'Hospital popular status updated', hospital });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.togglePopularHospital = togglePopularHospital;
const deleteHospital = async (req, res) => {
    await hospital_model_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hospital deleted' });
};
exports.deleteHospital = deleteHospital;
// --- Doctors ---
const getHospitalDoctors = async (req, res) => {
    // Find doctors assigned to this hospital (either via hospitalId or hospitalIds array)
    const doctors = await doctor_model_1.default.find({
        $or: [{ hospitalId: req.params.id }, { hospitalIds: req.params.id }]
    }).populate('userId', 'name email phone');
    res.json(doctors);
};
exports.getHospitalDoctors = getHospitalDoctors;
const addDoctorToHospital = async (req, res) => {
    const { doctorId } = req.body;
    if (!doctorId)
        return res.status(400).json({ message: 'doctorId required' });
    // Add to hospitalIds array (multi-hospital support) and keep hospitalId for backward compat
    const doctor = await doctor_model_1.default.findByIdAndUpdate(doctorId, {
        $addToSet: { hospitalIds: req.params.id },
        $set: { hospitalId: req.params.id },
    }, { new: true }).populate('userId', 'name email phone');
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
};
exports.addDoctorToHospital = addDoctorToHospital;
const removeDoctorFromHospital = async (req, res) => {
    await doctor_model_1.default.findByIdAndUpdate(req.params.doctorId, {
        $pull: { hospitalIds: req.params.id },
        $unset: { hospitalId: 1 },
    });
    res.json({ message: 'Doctor removed' });
};
exports.removeDoctorFromHospital = removeDoctorFromHospital;
// Set hospital-specific schedule for a doctor
const setDoctorHospitalSchedule = async (req, res) => {
    const { doctorId } = req.params;
    const { schedule } = req.body; // array of { day, startTime, endTime }
    if (!Array.isArray(schedule))
        return res.status(400).json({ message: 'schedule array required' });
    const doctor = await doctor_model_1.default.findById(doctorId);
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    // Update or insert hospital-specific schedule
    const existingIdx = doctor.hospitalSchedules?.findIndex((hs) => hs.hospitalId.toString() === req.params.id) ?? -1;
    if (existingIdx >= 0) {
        doctor.hospitalSchedules[existingIdx].schedule = schedule;
    }
    else {
        if (!doctor.hospitalSchedules)
            doctor.hospitalSchedules = [];
        doctor.hospitalSchedules.push({ hospitalId: req.params.id, schedule });
    }
    await doctor.save();
    res.json({ message: 'Schedule updated', schedule });
};
exports.setDoctorHospitalSchedule = setDoctorHospitalSchedule;
// Get hospital-specific schedule for a doctor
const getDoctorHospitalSchedule = async (req, res) => {
    const { doctorId } = req.params;
    const doctor = await doctor_model_1.default.findById(doctorId);
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    const hospitalSchedule = doctor.hospitalSchedules?.find((hs) => hs.hospitalId.toString() === req.params.id);
    const schedule = (hospitalSchedule?.schedule?.length ?? 0) > 0
        ? hospitalSchedule.schedule
        : doctor.schedule;
    res.json({ schedule, fees: doctor.fees });
};
exports.getDoctorHospitalSchedule = getDoctorHospitalSchedule;
// --- Ambulances ---
const getHospitalAmbulances = async (req, res) => {
    const ambulances = await ambulance_model_1.default.find({ hospitalId: req.params.id });
    res.json(ambulances);
};
exports.getHospitalAmbulances = getHospitalAmbulances;
const addAmbulanceToHospital = async (req, res) => {
    const { ambulanceId, userId, hospitalAmbulanceUserId } = req.body;
    if (!ambulanceId && !userId && !hospitalAmbulanceUserId) {
        return res.status(400).json({ message: 'ambulanceId, userId, or hospitalAmbulanceUserId required' });
    }
    try {
        let updateData = {
            hospitalId: req.params.id,
            type: 'hospital' // Set type to hospital
        };
        // If hospitalAmbulanceUserId is provided, find the ambulance associated with that user
        if (hospitalAmbulanceUserId && !ambulanceId && !userId) {
            const ambulance = await ambulance_model_1.default.findOne({ hospitalAmbulanceUserId });
            if (!ambulance) {
                return res.status(404).json({ message: 'No ambulance found for this user' });
            }
            const updatedAmbulance = await ambulance_model_1.default.findByIdAndUpdate(ambulance._id, updateData, { new: true });
            return res.json(updatedAmbulance);
        }
        // If userId is provided, find the ambulance associated with that user
        if (userId && !ambulanceId && !hospitalAmbulanceUserId) {
            const ambulance = await ambulance_model_1.default.findOne({ userId });
            if (!ambulance) {
                return res.status(404).json({ message: 'No ambulance found for this user' });
            }
            const updatedAmbulance = await ambulance_model_1.default.findByIdAndUpdate(ambulance._id, updateData, { new: true });
            return res.json(updatedAmbulance);
        }
        // If ambulanceId is provided, use it directly
        const ambulance = await ambulance_model_1.default.findByIdAndUpdate(ambulanceId, updateData, { new: true });
        if (!ambulance)
            return res.status(404).json({ message: 'Ambulance not found' });
        res.json(ambulance);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.addAmbulanceToHospital = addAmbulanceToHospital;
const removeAmbulanceFromHospital = async (req, res) => {
    await ambulance_model_1.default.findByIdAndUpdate(req.params.ambulanceId, { $unset: { hospitalId: 1 } });
    res.json({ message: 'Ambulance removed' });
};
exports.removeAmbulanceFromHospital = removeAmbulanceFromHospital;
// --- Services ---
const getHospitalServices = async (req, res) => {
    const services = await hospital_service_model_1.default.find({ hospitalId: req.params.id })
        .populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
    res.json(services);
};
exports.getHospitalServices = getHospitalServices;
const addHospitalService = async (req, res) => {
    const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl, imageUrl, serviceImageUrl, ourService } = req.body;
    if (!name)
        return res.status(400).json({ message: 'name required' });
    const service = await hospital_service_model_1.default.create({
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
exports.addHospitalService = addHospitalService;
const updateHospitalService = async (req, res) => {
    const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl, imageUrl, serviceImageUrl, ourService } = req.body;
    const service = await hospital_service_model_1.default.findByIdAndUpdate(req.params.serviceId, { name, shortTitle, about, ourService, whatWeOffer, availableDoctors, iconUrl, imageUrl, serviceImageUrl }, { new: true }).populate({ path: 'availableDoctors', populate: { path: 'userId', select: 'name' } });
    if (!service)
        return res.status(404).json({ message: 'Service not found' });
    res.json(service);
};
exports.updateHospitalService = updateHospitalService;
const removeHospitalService = async (req, res) => {
    await hospital_service_model_1.default.findByIdAndDelete(req.params.serviceId);
    res.json({ message: 'Service removed' });
};
exports.removeHospitalService = removeHospitalService;
