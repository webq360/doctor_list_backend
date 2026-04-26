import mongoose, { Document, Schema } from 'mongoose';

export interface ICenterService extends Document {
  centerId: mongoose.Types.ObjectId;
  centerType: string; // 'eye_care' | 'hearing_aid' | 'dental' | 'drug_rehab' | 'physiotherapy'
  name: string;
  about?: string;
  ourService?: string;
  serviceImageUrl?: string;
}

const centerServiceSchema = new Schema<ICenterService>(
  {
    centerId: { type: Schema.Types.ObjectId, required: true },
    centerType: { type: String, required: true },
    name: { type: String, required: true },
    about: { type: String },
    ourService: { type: String },
    serviceImageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICenterService>('CenterService', centerServiceSchema);
