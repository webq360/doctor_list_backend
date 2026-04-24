import mongoose, { Document, Schema } from 'mongoose';

export interface IPhysiotherapyCenter extends Document {
  name: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  location?: { lat: number; lng: number };
  contact: string;
  logo?: string;
  coverImage?: string;
}

const physiotherapyCenterSchema = new Schema<IPhysiotherapyCenter>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    location: { lat: { type: Number }, lng: { type: Number } },
    contact: { type: String, required: true },
    logo: { type: String },
    coverImage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPhysiotherapyCenter>('PhysiotherapyCenter', physiotherapyCenterSchema);
