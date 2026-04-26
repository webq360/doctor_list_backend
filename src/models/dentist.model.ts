import mongoose, { Document, Schema } from 'mongoose';

export interface IDentist extends Document {
  centerId: mongoose.Types.ObjectId;
  name: string;
  specialization: string;
  experience?: number;
  bio?: string;
  imageUrl?: string;
}

const dentistSchema = new Schema<IDentist>(
  {
    centerId: { type: Schema.Types.ObjectId, required: true, ref: 'DentalClinic' },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number },
    bio: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IDentist>('Dentist', dentistSchema);
