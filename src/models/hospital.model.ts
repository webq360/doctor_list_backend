import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  location?: { lat: number; lng: number };
  contact: string;
  logo?: string;
  coverImage?: string;
  doctors: mongoose.Types.ObjectId[];
}

const hospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    contact: { type: String, required: true },
    logo: { type: String },
    coverImage: { type: String },
    doctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }],
  },
  { timestamps: true }
);

export default mongoose.model<IHospital>('Hospital', hospitalSchema);
