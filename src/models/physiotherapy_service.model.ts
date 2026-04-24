import mongoose, { Document, Schema } from 'mongoose';

export interface IPhysiotherapyService extends Document {
  centerId: mongoose.Types.ObjectId;
  name: string;
  shortTitle?: string;
  about?: string;
  whatWeOffer: string[];
  availableDoctors: mongoose.Types.ObjectId[];
  iconUrl?: string;
}

const physiotherapyServiceSchema = new Schema<IPhysiotherapyService>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: 'PhysiotherapyCenter', required: true },
    name: { type: String, required: true },
    shortTitle: { type: String },
    about: { type: String },
    whatWeOffer: [{ type: String }],
    availableDoctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }],
    iconUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPhysiotherapyService>('PhysiotherapyService', physiotherapyServiceSchema);
