import mongoose, { Document, Schema } from 'mongoose';

interface ISchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  specializations: string[];
  experience: number;
  hospitalId?: mongoose.Types.ObjectId;
  schedule: ISchedule[];
  fees: number;
  bio: string;
  profileImage?: string;
  location?: { division?: string; district?: string; upazila?: string };
  isApproved: boolean;
}

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specializations: [{ type: String }],
    experience: { type: Number, default: 0 },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    schedule: [
      {
        day: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    fees: { type: Number, required: true },
    bio: { type: String },
    profileImage: { type: String },
    location: {
      division: { type: String },
      district: { type: String },
      upazila: { type: String },
    },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
