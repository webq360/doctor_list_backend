"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDoctor = exports.adminCreateDoctor = exports.approveDoctor = exports.updateDoctorProfile = exports.getDoctorById = exports.getAllDoctors = exports.createDoctorProfile = void 0;
const zod_1 = require("zod");
const doctor_model_1 = __importDefault(require("../models/doctor.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const doctorSchema = zod_1.z.object({
    specialization: zod_1.z.string().min(2),
    experience: zod_1.z.number().min(0),
    hospitalId: zod_1.z.string().optional(),
    schedule: zod_1.z.array(zod_1.z.object({ day: zod_1.z.string(), startTime: zod_1.z.string(), endTime: zod_1.z.string() })),
    fees: zod_1.z.number().min(0),
    bio: zod_1.z.string().optional(),
});
const createDoctorProfile = async (req, res) => {
    const parsed = doctorSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const existing = await doctor_model_1.default.findOne({ userId: req.user.id });
    if (existing)
        return res.status(409).json({ message: 'Profile already exists' });
    const doctor = await doctor_model_1.default.create({ ...parsed.data, userId: req.user.id });
    res.status(201).json(doctor);
};
exports.createDoctorProfile = createDoctorProfile;
const getAllDoctors = async (req, res) => {
    const { name, specialization, division, district, upazila } = req.query;
    const filter = { isApproved: true };
    if (specialization)
        filter['specializations'] = { $elemMatch: { $regex: specialization, $options: 'i' } };
    if (division)
        filter['location.division'] = new RegExp(division, 'i');
    if (district)
        filter['location.district'] = new RegExp(district, 'i');
    if (upazila)
        filter['location.upazila'] = new RegExp(upazila, 'i');
    let doctors = await doctor_model_1.default.find(filter)
        .populate('userId', 'name email phone')
        .populate('hospitalId', 'name address logo')
        .populate('hospitalIds', 'name address division district upazila')
        .populate('departments', 'title description');
    // Filter by name (from populated userId)
    if (name) {
        const n = name.toLowerCase();
        doctors = doctors.filter((d) => d.userId?.name?.toLowerCase().includes(n));
    }
    res.json(doctors);
};
exports.getAllDoctors = getAllDoctors;
const getDoctorById = async (req, res) => {
    const doctor = await doctor_model_1.default.findById(req.params.id)
        .populate('userId', 'name email phone')
        .populate('hospitalId', 'name address')
        .populate('hospitalIds', 'name address division district upazila')
        .populate('departments', 'title description');
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
};
exports.getDoctorById = getDoctorById;
const updateDoctorProfile = async (req, res) => {
    const doctor = await doctor_model_1.default.findOneAndUpdate({ userId: req.user.id }, req.body, { new: true });
    if (!doctor)
        return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor);
};
exports.updateDoctorProfile = updateDoctorProfile;
const approveDoctor = async (req, res) => {
    const doctor = await doctor_model_1.default.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!doctor)
        return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor approved', doctor });
};
exports.approveDoctor = approveDoctor;
const adminCreateDoctor = async (req, res) => {
    try {
        const { name, phone, bmdcNumber, specializations, departments, experience, fees, bio, hospitalIds, profileImage } = req.body;
        if (!name || !fees) {
            return res.status(400).json({ message: 'name and fees are required' });
        }
        // Check if BMDC number already exists (only if provided)
        if (bmdcNumber) {
            const existingBmdc = await doctor_model_1.default.findOne({ bmdcNumber });
            if (existingBmdc) {
                return res.status(409).json({ message: 'BMDC number already exists' });
            }
        }
        // Check if user with this phone already exists (only if phone provided)
        let user;
        if (phone) {
            const existingUser = await user_model_1.default.findOne({ phone });
            if (existingUser) {
                // If user exists, check if they already have a doctor profile
                const existingDoctor = await doctor_model_1.default.findOne({ userId: existingUser._id });
                if (existingDoctor) {
                    return res.status(409).json({ message: 'Doctor profile already exists for this phone number' });
                }
                user = existingUser;
            }
            else {
                // Create new user with phone as email and a default password
                const email = `${phone}@doctor.temp`;
                const defaultPassword = phone; // Use phone as default password
                user = await user_model_1.default.create({ name, email, phone, password: defaultPassword, role: 'doctor' });
            }
        }
        else {
            // Create user without phone - use name-based email
            const email = `${name.toLowerCase().replace(/\s+/g, '.')}@doctor.temp`;
            const defaultPassword = 'doctor123'; // Default password when no phone
            user = await user_model_1.default.create({ name, email, password: defaultPassword, role: 'doctor' });
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
        const doctor = await doctor_model_1.default.create({
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
            await Hospital.updateMany({ _id: { $in: hospitalIds } }, { $addToSet: { doctors: doctor._id } });
        }
        const populated = await doctor_model_1.default.findById(doctor._id)
            .populate('userId', 'name email phone')
            .populate('hospitalIds', 'name')
            .populate('hospitalId', 'name')
            .populate('departments', 'title description');
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.adminCreateDoctor = adminCreateDoctor;
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await doctor_model_1.default.findByIdAndDelete(req.params.id);
        if (!doctor)
            return res.status(404).json({ message: 'Doctor not found' });
        res.json({ message: 'Doctor deleted' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteDoctor = deleteDoctor;
