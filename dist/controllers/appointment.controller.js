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
    date: zod_1.z.string().optional(),
    time: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    // Patient details
    patientType: zod_1.z.enum(['Myself', 'Others']).default('Myself'),
    patientName: zod_1.z.string().optional(),
    patientMobile: zod_1.z.string().optional(),
    patientAge: zod_1.z.number().optional(),
    patientGender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    patientAddress: zod_1.z.string().optional(),
});
const bookAppointment = async (req, res) => {
    const parsed = appointmentSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ errors: parsed.error.flatten() });
    // Set default date and time if not provided
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const appointment = await appointment_model_1.default.create({
        ...parsed.data,
        patientId: req.user.id,
        date: parsed.data.date || currentDate,
        time: parsed.data.time || currentTime,
    });
    res.status(201).json(appointment);
};
exports.bookAppointment = bookAppointment;
const getMyAppointments = async (req, res) => {
    const filter = req.user.role === 'patient' ? { patientId: req.user.id } : {};
    const appointments = await appointment_model_1.default.find(filter)
        .populate('patientId', 'name phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('hospitalId', 'name address contactPersons')
        .sort({ createdAt: -1 }); // Sort by newest first
    // Auto-delete old history appointments (keep only last 10 completed/cancelled)
    const historyAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');
    if (historyAppointments.length > 10) {
        const appointmentsToDelete = historyAppointments.slice(10);
        const idsToDelete = appointmentsToDelete.map(a => a._id);
        await appointment_model_1.default.deleteMany({ _id: { $in: idsToDelete } });
        // Return updated list without deleted appointments
        const updatedAppointments = appointments.filter(a => !idsToDelete.some(id => id.toString() === a._id.toString()));
        return res.json(updatedAppointments);
    }
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
    const { status, statusChangeMessage, serialNumber } = req.body;
    // Find the appointment first to check permissions
    const existingAppointment = await appointment_model_1.default.findById(req.params.id);
    if (!existingAppointment)
        return res.status(404).json({ message: 'Appointment not found' });
    // Check permissions: 
    // - Patients can only cancel their own appointments
    // - Doctors and admins can update any appointment status
    if (req.user.role === 'patient') {
        if (existingAppointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own appointments' });
        }
        if (status !== 'cancelled') {
            return res.status(403).json({ message: 'Patients can only cancel appointments' });
        }
    }
    const updateData = { status, statusChangeMessage };
    // If manual serial number is provided for confirmed status, use it
    if (status === 'confirmed' && serialNumber && serialNumber.trim()) {
        updateData.serialNumber = serialNumber.trim();
    }
    const appointment = await appointment_model_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true })
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
