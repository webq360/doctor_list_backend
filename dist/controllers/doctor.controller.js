"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveDoctor = exports.updateDoctorProfile = exports.getDoctorById = exports.getAllDoctors = exports.createDoctorProfile = void 0;
const zod_1 = require("zod");
const doctor_model_1 = __importDefault(require("../models/doctor.model"));
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
    const { specialization } = req.query;
    const filter = { isApproved: true };
    if (specialization)
        filter.specialization = new RegExp(specialization, 'i');
    const doctors = await doctor_model_1.default.find(filter).populate('userId', 'name email phone').populate('hospitalId', 'name address');
    res.json(doctors);
};
exports.getAllDoctors = getAllDoctors;
const getDoctorById = async (req, res) => {
    const doctor = await doctor_model_1.default.findById(req.params.id)
        .populate('userId', 'name email phone')
        .populate('hospitalId', 'name address');
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
