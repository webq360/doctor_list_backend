"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoctorHospitalSchedule = exports.getAllAppointments = exports.updateAppointmentStatus = exports.getDoctorAppointments = exports.getMyAppointments = exports.bookAppointment = void 0;
const zod_1 = require("zod");
const appointment_model_1 = __importDefault(require("../models/appointment.model"));
const appointmentSchema = zod_1.z.object({
    doctorId: zod_1.z.string(),
    hospitalId: zod_1.z.string().optional(),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
const bookAppointment = async (req, res) => {
    const parsed = appointmentSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    const appointment = await appointment_model_1.default.create({ ...parsed.data, patientId: req.user.id });
    res.status(201).json(appointment);
};
exports.bookAppointment = bookAppointment;
const getMyAppointments = async (req, res) => {
    const filter = req.user.role === 'patient' ? { patientId: req.user.id } : {};
    const appointments = await appointment_model_1.default.find(filter)
        .populate('patientId', 'name phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('hospitalId', 'name address');
    res.json(appointments);
};
exports.getMyAppointments = getMyAppointments;
const getDoctorAppointments = async (req, res) => {
    const appointments = await appointment_model_1.default.find({ doctorId: req.params.doctorId })
        .populate('patientId', 'name phone')
        .populate('hospitalId', 'name');
    res.json(appointments);
};
exports.getDoctorAppointments = getDoctorAppointments;
const updateAppointmentStatus = async (req, res) => {
    const { status } = req.body;
    const appointment = await appointment_model_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!appointment)
        return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
};
exports.updateAppointmentStatus = updateAppointmentStatus;
const getAllAppointments = async (req, res) => {
    const appointments = await appointment_model_1.default.find()
        .populate('patientId', 'name')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('hospitalId', 'name');
    res.json(appointments);
};
exports.getAllAppointments = getAllAppointments;
// Get available schedule for a doctor at a specific hospital
const getDoctorHospitalSchedule = async (req, res) => {
    try {
        const Doctor = require('../models/doctor.model').default;
        const { doctorId, hospitalId } = req.params;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor)
            return res.status(404).json({ message: 'Doctor not found' });
        // Find hospital-specific schedule
        const hospitalSchedule = doctor.hospitalSchedules?.find((hs) => hs.hospitalId.toString() === hospitalId);
        // Fall back to global schedule if no hospital-specific one
        const schedule = hospitalSchedule?.schedule?.length > 0
            ? hospitalSchedule.schedule
            : doctor.schedule;
        res.json({ schedule, fees: doctor.fees });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getDoctorHospitalSchedule = getDoctorHospitalSchedule;
