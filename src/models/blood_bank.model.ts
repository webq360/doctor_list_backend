import mongoose, { Document, Schema } from 'mongoose';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface IBloodBank extends Document {
  name: string;
  contact: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  location?: { lat: number; lng: number };
  availableGroups: BloodGroup[];
  hospitalId?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const bloodBankSchema = new Schema<IBloodBank>(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    location: { lat: { type: Number }, lng: { type: Number } },
    availableGroups: [{ type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }],
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBloodBank>('BloodBank', bloodBankSchema);
