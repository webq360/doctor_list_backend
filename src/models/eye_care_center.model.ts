import mongoose, { Document, Schema } from 'mongoose';

export interface IEyeCareCenter extends Document {
  name: string;
  contact: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  services: string[];
  isActive: boolean;
  imageUrl?: string;
}

const eyeCareCenterSchema = new Schema<IEyeCareCenter>(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    services: [{ type: String }],
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IEyeCareCenter>('EyeCareCenter', eyeCareCenterSchema);
