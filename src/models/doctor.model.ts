import mongoose, { Document, Schema } from 'mongoose';

interface ISchedule {
  day: string;
  startTime: string;
  endTime: string;
}

// Hospital-specific schedule: doctor can have different times at different hospitals
interface IHospitalSchedule {
  hospitalId: mongoose.Types.ObjectId;
  schedule: ISchedule[];
}

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  specializations: string[];
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

const scheduleSchema = new Schema({ day: String, startTime: String, endTime: String }, { _id: false });

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specializations: [{ type: String }],
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
