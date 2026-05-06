import mongoose, { Document, Schema } from 'mongoose';

export type BannerCategory = 'home_slider';

export interface IBanner extends Document {
  imageUrl: string;
  title?: string;
  isActive: boolean;
  order: number;
  category: BannerCategory;
  location?: {
    division?: string;
    district?: string;
    upazila?: string;
  };
}

const bannerSchema = new Schema<IBanner>(
  {
    imageUrl: { type: String, required: true },
    title: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ['home_slider'],
      required: true,
      default: 'home_slider',
    },
    location: {
      division: { type: String },
      district: { type: String },
      upazila: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBanner>('Banner', bannerSchema);
