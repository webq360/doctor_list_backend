import { Request, Response } from 'express';
import { z } from 'zod';
import Appointment from '../models/appointment.model';
import { AuthRequest } from '../middleware/auth.middleware';

const appointmentSchema = z.object({
  doctorId: z.string(),
  hospitalId: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  
  // Patient details
  patientType: z.enum(['Myself', 'Others']).default('Myself'),
  patientName: z.string().optional(),
  patientMobile: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.enum(['Male', 'Female', 'Other']).optional(),
  patientAddress: z.string().optional(),
});

export const bookAppointment = async (req: AuthRequest, res: Response) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  // Set default date and time if not provided
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const appointment = await Appointment.create({ 
    ...parsed.data, 
    patientId: req.user!.id,
    date: parsed.data.date || currentDate,
    time: parsed.data.time || currentTime,
  });
  
  res.status(201).json(appointment);
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  const filter = req.user!.role === 'patient' ? { patientId: req.user!.id } : {};
  const appointments = await Appointment.find(filter)
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('hospitalId', 'name address contactPersons');
  res.json(appointments);
};

export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  const appointments = await Appointment.find({ doctorId: req.params.doctorId })
    .populate('patientId', 'name phone')
    .populate('hospitalId', 'name address contactPersons');
  res.json(appointments);
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  const { status, statusChangeMessage, serialNumber } = req.body;
  
  const updateData: any = { status, statusChangeMessage };
  
  // If manual serial number is provided for confirmed status, use it
  if (status === 'confirmed' && serialNumber && serialNumber.trim()) {
    updateData.serialNumber = serialNumber.trim();
  }
  
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id, 
    updateData, 
    { new: true }
  )
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('hospitalId', 'name address contactPersons');
  
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

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
      sentBy: (req as any).user.id,
    });

    // Send FCM push notification
    const { sendPushToTokens } = require('../services/fcm.service');
    const user = await require('../models/user.model').default.findById(appointment.patientId._id);
    if (user?.fcmToken) {
      await sendPushToTokens(
        [user.fcmToken],
        title,
        body,
        undefined,
        { notificationId: appointment._id.toString() }
      );
    }
  } catch (err) {
    console.error('Failed to send notification:', err);
    // Don't fail the response if notification fails
  }

  res.json(appointment);
};

export const getAllAppointments = async (req: Request, res: Response) => {
  const appointments = await Appointment.find()
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('hospitalId', 'name address contactPersons')
    .sort({ date: -1, time: -1 });
  res.json(appointments);
};

// Get available schedule for a doctor at a specific hospital
export const getDoctorHospitalSchedule = async (req: Request, res: Response) => {
  try {
    const Doctor = require('../models/doctor.model').default;
    const { doctorId, hospitalId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Find hospital-specific schedule
    const hospitalSchedule = doctor.hospitalSchedules?.find(
      (hs: any) => hs.hospitalId.toString() === hospitalId
    );

    // Fall back to global schedule if no hospital-specific one
    const schedule = hospitalSchedule?.schedule?.length > 0
      ? hospitalSchedule.schedule
      : doctor.schedule;

    res.json({ schedule, fees: doctor.fees });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
