import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  imageUrl?: string;
  role: 'patient' | 'doctor' | 'admin' | 'ambulance_user';
  isActive: boolean;
  fcmToken?: string;
  division?: string;
  district?: string;
  upazila?: string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, default: undefined },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    imageUrl: { type: String },
    role: { type: String, enum: ['patient', 'doctor', 'admin', 'ambulance_user'], default: 'patient' },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (this: IUser, password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
