import mongoose, { Document, Schema } from 'mongoose';

export interface IHospitalAmbulanceUser extends Document {
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  isActive: boolean;
}

const hospitalAmbulanceUserSchema = new Schema<IHospitalAmbulanceUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, default: undefined },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHospitalAmbulanceUser>('HospitalAmbulanceUser', hospitalAmbulanceUserSchema);
