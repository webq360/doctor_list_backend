import mongoose, { Document, Schema } from 'mongoose';

export interface ITherapist extends Document {
  centerId: mongoose.Types.ObjectId;
  centerType: string; // 'physiotherapy' | etc.
  name: string;
  specialization: string;
  experience: number;
  bio?: string;
  imageUrl?: string;
  isActive: boolean;
}

const therapistSchema = new Schema<ITherapist>(
  {
    centerId: { type: Schema.Types.ObjectId, required: true },
    centerType: { type: String, required: true, default: 'physiotherapy' },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, default: 0 },
    bio: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITherapist>('Therapist', therapistSchema);
