"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeHospitalService = exports.addHospitalService = exports.getHospitalServices = exports.removeAmbulanceFromHospital = exports.addAmbulanceToHospital = exports.getHospitalAmbulances = exports.removeDoctorFromHospital = exports.addDoctorToHospital = exports.getHospitalDoctors = exports.deleteHospital = exports.updateHospital = exports.getNearestHospitals = exports.getHospitalById = exports.getAllHospitals = exports.createHospital = void 0;
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
    contact: zod_1.z.string().min(5),
    logo: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().optional(),
});
const createHospital = async (req, res) => {
    try {
        const parsed = hospitalSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ errors: parsed.error.flatten() });
        const hospital = await hospital_model_1.default.create(parsed.data);
        res.status(201).json(hospital);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createHospital = createHospital;
const getAllHospitals = async (req, res) => {
    const hospitals = await hospital_model_1.default.find().populate('doctors');
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
    const hospital = await hospital_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hospital)
        return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
};
exports.updateHospital = updateHospital;
const deleteHospital = async (req, res) => {
    await hospital_model_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hospital deleted' });
};
exports.deleteHospital = deleteHospital;
// --- Doctors ---
const getHospitalDoctors = async (req, res) => {
    const doctors = await doctor_model_1.default.find({ hospitalId: req.params.id }).populate('userId', 'name email phone');
    res.json(doctors);
};
exports.getHospitalDoctors = getHospitalDoctors;
const addDoctorToHospital = async (req, res) => {
    const { doctorId } = req.body;
    if (!doctorId)
        return res.status(400).json({ message: 'doctorId required' });
    const doctor = await doctor_model_1.default.findByIdAndUpdate(doctorId, { hospitalId: req.params.id }, { new: true }).populate('userId', 'name email phone');
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
};
exports.addDoctorToHospital = addDoctorToHospital;
const removeDoctorFromHospital = async (req, res) => {
    await doctor_model_1.default.findByIdAndUpdate(req.params.doctorId, { $unset: { hospitalId: 1 } });
    res.json({ message: 'Doctor removed' });
};
exports.removeDoctorFromHospital = removeDoctorFromHospital;
// --- Ambulances ---
const getHospitalAmbulances = async (req, res) => {
    const ambulances = await ambulance_model_1.default.find({ hospitalId: req.params.id });
    res.json(ambulances);
};
exports.getHospitalAmbulances = getHospitalAmbulances;
const addAmbulanceToHospital = async (req, res) => {
    const { ambulanceId } = req.body;
    if (!ambulanceId)
        return res.status(400).json({ message: 'ambulanceId required' });
    const ambulance = await ambulance_model_1.default.findByIdAndUpdate(ambulanceId, { hospitalId: req.params.id }, { new: true });
    if (!ambulance)
        return res.status(404).json({ message: 'Ambulance not found' });
    res.json(ambulance);
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
    const { name, shortTitle, about, whatWeOffer, availableDoctors, iconUrl } = req.body;
    if (!name)
        return res.status(400).json({ message: 'name required' });
    const service = await hospital_service_model_1.default.create({
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
exports.addHospitalService = addHospitalService;
const removeHospitalService = async (req, res) => {
    await hospital_service_model_1.default.findByIdAndDelete(req.params.serviceId);
    res.json({ message: 'Service removed' });
};
exports.removeHospitalService = removeHospitalService;
