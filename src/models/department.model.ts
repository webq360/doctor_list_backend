import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  title: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

const departmentSchema = new Schema<IDepartment>(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>('Department', departmentSchema);