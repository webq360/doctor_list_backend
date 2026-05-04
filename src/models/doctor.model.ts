import mongoose, { Document, Schema } from 'mongoose';

interface IShift {
  shift: 'Morning' | 'Evening' | 'Night';
  startTime: string;
  endTime: string;
}

interface ISchedule {
  day: string;
  shifts?: IShift[];  // New shift-based format
  // Legacy fields for backward compatibility
  startTime?: string;
  endTime?: string;
}

// Hospital-specific schedule: doctor can have different times at different hospitals
interface IHospitalSchedule {
  hospitalId: mongoose.Types.ObjectId;
  schedule: ISchedule[];
}

// Education entry
interface IEducation {
  degree: string;
  institution: string;
  year: string;
}

// Work experience entry
interface IExperience {
  position: string;
  organization: string;
  duration: string;
}

// Education/Experience entry (new format with title + description)
interface IEducationExperience {
  title: string;
  description: string;
}

// Location entry (multiple locations support)
interface ILocation {
  division?: string;
  district?: string;
  upazila?: string;
}

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  bmdcNumber: string;                          // BMDC registration number (unique)
  specializations: string[];
  departments: mongoose.Types.ObjectId[];      // assigned departments
  experience: number;                          // years of experience (legacy field)
  workExperience: IExperience[];               // detailed work experience entries
  hospitalId?: mongoose.Types.ObjectId;       // primary hospital (legacy)
  hospitalIds: mongoose.Types.ObjectId[];      // all assigned hospitals
  hospitalSchedules: IHospitalSchedule[];      // per-hospital schedules
  schedule: ISchedule[];                       // default/global schedule
  fees: number;
  bio: string;
  profileImage?: string;
  location?: { division?: string; district?: string; upazila?: string };  // Legacy single location
  locations: ILocation[];                      // Multiple locations array
  isApproved: boolean;
  isPopular: boolean;                          // Mark doctor as popular
  rating: number;
  ratingCount: number;
  // New fields for diseases and education
  diseasesTitle?: string;
  diseasesDescription?: string;
  education: IEducation[];
  educationTitle?: string;
  educationDescription?: string;
  educationExperience: IEducationExperience[];  // New array format
}

const shiftSchema = new Schema({ 
  shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true } 
}, { _id: false });

const scheduleSchema = new Schema({ 
  day: { type: String, required: true }, 
  shifts: [shiftSchema],  // New shift-based format
  // Legacy fields for backward compatibility
  startTime: { type: String }, 
  endTime: { type: String } 
}, { _id: false });

const educationSchema = new Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: String, required: true }
}, { _id: false });

const experienceSchema = new Schema({
  position: { type: String, required: true },
  organization: { type: String, required: true },
  duration: { type: String, required: true }
}, { _id: false });

const educationExperienceSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const locationSchema = new Schema({
  division: { type: String },
  district: { type: String },
  upazila: { type: String }
}, { _id: false });

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bmdcNumber: { type: String, unique: true, sparse: true },
    specializations: [{ type: String }],
    departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    experience: { type: Number, default: 0 },
    workExperience: [experienceSchema],
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    hospitalIds: [{ type: Schema.Types.ObjectId, ref: 'Hospital' }],
    hospitalSchedules: [
      {
        hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
        schedule: [scheduleSchema],
      },
    ],
    schedule: [scheduleSchema],
    fees: { type: Number, required: true },
    bio: { type: String },
    profileImage: { type: String },
    location: {
      division: { type: String },
      district: { type: String },
      upazila: { type: String },
    },
    locations: [locationSchema],  // Multiple locations array
    isApproved: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    // New fields for diseases and education
    diseasesTitle: { type: String },
    diseasesDescription: { type: String },
    education: [educationSchema],
    educationTitle: { type: String },
    educationDescription: { type: String },
    educationExperience: [educationExperienceSchema],  // New array format
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
