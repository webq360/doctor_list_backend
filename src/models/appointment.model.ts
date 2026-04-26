import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId?: mongoose.Types.ObjectId;   // which hospital this appointment is at
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
