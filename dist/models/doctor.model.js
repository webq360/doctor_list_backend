"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const shiftSchema = new mongoose_1.Schema({
    shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
}, { _id: false });
const scheduleSchema = new mongoose_1.Schema({
    day: { type: String, required: true },
    shifts: [shiftSchema], // New shift-based format
    // Legacy fields for backward compatibility
    startTime: { type: String },
    endTime: { type: String }
}, { _id: false });
const educationSchema = new mongoose_1.Schema({
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true }
}, { _id: false });
const experienceSchema = new mongoose_1.Schema({
    position: { type: String, required: true },
    organization: { type: String, required: true },
    duration: { type: String, required: true }
}, { _id: false });
const educationExperienceSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true }
}, { _id: false });
const locationSchema = new mongoose_1.Schema({
    division: { type: String },
    district: { type: String },
    upazila: { type: String }
}, { _id: false });
const doctorSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bmdcNumber: { type: String, unique: true, sparse: true },
    specializations: [{ type: String }],
    departments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' }],
    experience: { type: Number, default: 0 },
    workExperience: [experienceSchema],
    hospitalId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hospital' },
    hospitalIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Hospital' }],
    hospitalSchedules: [
        {
            hospitalId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hospital', required: true },
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
    locations: [locationSchema], // Multiple locations array
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
    educationExperience: [educationExperienceSchema], // New array format
}, { timestamps: true });
exports.default = mongoose_1.default.model('Doctor', doctorSchema);
