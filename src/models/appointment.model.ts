import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId?: mongoose.Types.ObjectId;   // which hospital this appointment is at
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  
  // Patient details
  patientType: 'Myself' | 'Others';  // Is appointment for self or someone else
  patientName?: string;  // Name (only for Others)
  patientMobile?: string;  // Mobile (only for Others)
  patientAge?: number;  // Age
  patientGender?: 'Male' | 'Female' | 'Other';  // Gender
  patientAddress?: string;  // Address (only for Others)
  
  serialNumber?: string;  // Unique serial number for the appointment
  statusChangeMessage?: string;  // Message sent when status is changed
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
    
    // Patient details
    patientType: { type: String, enum: ['Myself', 'Others'], default: 'Myself' },
    patientName: { type: String },
    patientMobile: { type: String },
    patientAge: { type: Number },
    patientGender: { type: String, enum: ['Male', 'Female', 'Other'] },
    patientAddress: { type: String },
    
    serialNumber: { type: String, unique: true, sparse: true },
    statusChangeMessage: { type: String },
  },
  { timestamps: true }
);

// Generate serial number before saving
appointmentSchema.pre<IAppointment>('save', async function (next) {
  if (!this.serialNumber) {
    // Generate serial number: APT-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.serialNumber = `APT-${dateStr}-${random}`;
  }
  next();
});

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
