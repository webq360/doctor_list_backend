import { Request, Response } from 'express';
import { z } from 'zod';
import Appointment from '../models/appointment.model';
import { AuthRequest } from '../middleware/auth.middleware';

const appointmentSchema = z.object({
  doctorId: z.string(),
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
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
  res.json(appointments);
};

export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  const appointments = await Appointment.find({ doctorId: req.params.doctorId })
    .populate('patientId', 'name phone');
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
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
  res.json(appointments);
};
