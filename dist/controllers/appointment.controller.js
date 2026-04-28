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
        .populate('hospitalId', 'name address contactPersons');
    res.json(appointments);
};
exports.getMyAppointments = getMyAppointments;
const getDoctorAppointments = async (req, res) => {
    const appointments = await appointment_model_1.default.find({ doctorId: req.params.doctorId })
        .populate('patientId', 'name phone')
        .populate('hospitalId', 'name address contactPersons');
    res.json(appointments);
};
exports.getDoctorAppointments = getDoctorAppointments;
const updateAppointmentStatus = async (req, res) => {
    const { status, statusChangeMessage } = req.body;
    const appointment = await appointment_model_1.default.findByIdAndUpdate(req.params.id, { status, statusChangeMessage }, { new: true })
        .populate('patientId', 'name phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('hospitalId', 'name address contactPersons');
    if (!appointment)
        return res.status(404).json({ message: 'Appointment not found' });
    // Send notification to patient for any status change
    try {
        const Notification = require('../models/notification.model').default;
        // Build notification title and body based on status
        let title = '';
        let body = '';
        switch (status) {
            case 'confirmed':
                title = 'Appointment Confirmed';
                body = `Your appointment has been confirmed. Serial Number: ${appointment.serialNumber}`;
                if (statusChangeMessage) {
                    body += `\n\n${statusChangeMessage}`;
                }
                break;
            case 'completed':
                title = 'Appointment Completed';
                body = `Your appointment has been completed.`;
                if (statusChangeMessage) {
                    body += `\n\n${statusChangeMessage}`;
                }
                break;
            case 'cancelled':
                title = 'Appointment Cancelled';
                body = `Your appointment has been cancelled.`;
                if (statusChangeMessage) {
                    body += `\n\n${statusChangeMessage}`;
                }
                break;
            case 'pending':
                title = 'Appointment Status Updated';
                body = `Your appointment status has been updated to pending.`;
                if (statusChangeMessage) {
                    body += `\n\n${statusChangeMessage}`;
                }
                break;
            default:
                title = 'Appointment Status Updated';
                body = `Your appointment status has been updated to ${status}.`;
                if (statusChangeMessage) {
                    body += `\n\n${statusChangeMessage}`;
                }
        }
        await Notification.create({
            title,
            body,
            targetRole: 'patient',
            sentBy: req.user.id,
        });
        // Send FCM push notification
        const { sendPushToTokens } = require('../services/fcm.service');
        const user = await require('../models/user.model').default.findById(appointment.patientId._id);
        if (user?.fcmToken) {
            await sendPushToTokens([user.fcmToken], title, body, undefined, { notificationId: appointment._id.toString() });
        }
    }
    catch (err) {
        console.error('Failed to send notification:', err);
        // Don't fail the response if notification fails
    }
    res.json(appointment);
};
exports.updateAppointmentStatus = updateAppointmentStatus;
const getAllAppointments = async (req, res) => {
    const appointments = await appointment_model_1.default.find()
        .populate('patientId', 'name phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('hospitalId', 'name address contactPersons')
        .sort({ date: -1, time: -1 });
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
