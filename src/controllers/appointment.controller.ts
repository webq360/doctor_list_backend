import { Request, Response } from 'express';
import { z } from 'zod';
import Appointment from '../models/appointment.model';
import { AuthRequest } from '../middleware/auth.middleware';

const appointmentSchema = z.object({
  doctorId: z.string(),
  hospitalId: z.string().optional(),
  date: z.string(),
  time: z.string(),
  notes: z.string().optional(),
});

export const bookAppointment = async (req: AuthRequest, res: Response) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const appointment = await Appointment.create({ ...parsed.data, patientId: req.user!.id });
  res.status(201).json(appointment);
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  const filter = req.user!.role === 'patient' ? { patientId: req.user!.id } : {};
  const appointments = await Appointment.find(filter)
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('hospitalId', 'name address');
  res.json(appointments);
};

export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  const appointments = await Appointment.find({ doctorId: req.params.doctorId })
    .populate('patientId', 'name phone')
    .populate('hospitalId', 'name');
  res.json(appointments);
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  res.json(appointment);
};

export const getAllAppointments = async (req: Request, res: Response) => {
  const appointments = await Appointment.find()
    .populate('patientId', 'name')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('hospitalId', 'name');
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
