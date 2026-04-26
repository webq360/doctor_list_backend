import mongoose, { Document, Schema } from 'mongoose';

export interface IHospitalService extends Document {
  hospitalId: mongoose.Types.ObjectId;
  name: string;
  shortTitle?: string;
  about?: string;
  whatWeOffer: string[];
  availableDoctors: mongoose.Types.ObjectId[];
  iconUrl?: string;
  imageUrl?: string;
  ourService?: string;
  serviceImageUrl?: string;
}

const hospitalServiceSchema = new Schema<IHospitalService>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    shortTitle: { type: String },
    about: { type: String },
    whatWeOffer: [{ type: String }],
    availableDoctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }],
    iconUrl: { type: String },
    imageUrl: { type: String },
    serviceImageUrl: { type: String },
    ourService: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IHospitalService>('HospitalService', hospitalServiceSchema);
