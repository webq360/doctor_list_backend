import mongoose, { Document, Schema } from 'mongoose';

interface IShift {
  shift: 'Morning' | 'Evening' | 'Night';
  startTime: string;
  endTime: string;
}

interface ISchedule {
  day: string;
  shifts?: IShift[];  // New shift-based format
  // Legacy fields for backward compatibility
  startTime?: string;
  endTime?: string;
}

// Hospital-specific schedule: doctor can have different times at different hospitals
interface IHospitalSchedule {
  hospitalId: mongoose.Types.ObjectId;
  schedule: ISchedule[];
}

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  bmdcNumber: string;                          // BMDC registration number (unique)
  specializations: string[];
  departments: mongoose.Types.ObjectId[];      // assigned departments
  experience: number;
  hospitalId?: mongoose.Types.ObjectId;       // primary hospital (legacy)
  hospitalIds: mongoose.Types.ObjectId[];      // all assigned hospitals
  hospitalSchedules: IHospitalSchedule[];      // per-hospital schedules
  schedule: ISchedule[];                       // default/global schedule
  fees: number;
  bio: string;
  profileImage?: string;
  location?: { division?: string; district?: string; upazila?: string };
  isApproved: boolean;
  rating: number;
  ratingCount: number;
}

const shiftSchema = new Schema({ 
  shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true } 
}, { _id: false });

const scheduleSchema = new Schema({ 
  day: { type: String, required: true }, 
  shifts: [shiftSchema],  // New shift-based format
  // Legacy fields for backward compatibility
  startTime: { type: String }, 
  endTime: { type: String } 
}, { _id: false });

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bmdcNumber: { type: String, unique: true, sparse: true },
    specializations: [{ type: String }],
    departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    experience: { type: Number, default: 0 },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    hospitalIds: [{ type: Schema.Types.ObjectId, ref: 'Hospital' }],
    hospitalSchedules: [
      {
        hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
        schedule: [scheduleSchema],
      },
    ],
    schedule: [scheduleSchema],
    fees: { type: Number, required: true },
    bio: { type: String },
    profileImage: { type: String },
    location: {
      division: { type: String },
      district: { type: String },
      upazila: { type: String },
    },
    isApproved: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
