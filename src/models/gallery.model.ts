import mongoose, { Document, Schema } from 'mongoose';

export interface IGallery extends Document {
  centerId: mongoose.Types.ObjectId;
  centerType: string;
  imageUrl: string;
  caption?: string;
  title?: string;
  description?: string;
}

const gallerySchema = new Schema<IGallery>(
  {
    centerId: { type: Schema.Types.ObjectId, required: true },
    centerType: { type: String, required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String },
    title: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IGallery>('Gallery', gallerySchema);
