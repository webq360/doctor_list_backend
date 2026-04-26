import mongoose, { Document, Schema } from 'mongoose';

export interface IHearingAidCenter extends Document {
  name: string;
  contact: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  services: string[];
  ourServices?: string;
  isActive: boolean;
}

const hearingAidCenterSchema = new Schema<IHearingAidCenter>(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    services: [{ type: String }],
    ourServices: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHearingAidCenter>('HearingAidCenter', hearingAidCenterSchema);
