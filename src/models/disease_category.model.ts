import mongoose, { Document, Schema } from 'mongoose';

export interface IDiseaseCategory extends Document {
  name: string;
  specializations: string[];
  description?: string;
  icon?: string;
  isActive: boolean;
}

const diseaseCategorySchema = new Schema<IDiseaseCategory>(
  {
    name: { type: String, required: true, unique: true },
    specializations: [{ type: String }],
    description: { type: String },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDiseaseCategory>('DiseaseCategory', diseaseCategorySchema);
