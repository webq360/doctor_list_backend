"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = require("./config/db");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const hospital_routes_1 = __importDefault(require("./routes/hospital.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const ambulance_routes_1 = __importDefault(require("./routes/ambulance.routes"));
const ambulance_request_routes_1 = __importDefault(require("./routes/ambulance_request.routes"));
const banner_routes_1 = __importDefault(require("./routes/banner.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const blood_bank_routes_1 = __importDefault(require("./routes/blood_bank.routes"));
const physiotherapy_center_routes_1 = __importDefault(require("./routes/physiotherapy_center.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const eye_care_center_routes_1 = __importDefault(require("./routes/eye_care_center.routes"));
const hearing_aid_center_routes_1 = __importDefault(require("./routes/hearing_aid_center.routes"));
const dental_clinic_routes_1 = __importDefault(require("./routes/dental_clinic.routes"));
const drug_rehabilitation_center_routes_1 = __importDefault(require("./routes/drug_rehabilitation_center.routes"));
const disease_category_routes_1 = __importDefault(require("./routes/disease_category.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = ['https://doctorlist-admin.vercel.app', 'https://doctor-list-backend-x5qp.vercel.app', 'http://localhost:3000', 'http://localhost:5000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get('/', (_req, res) => {
    res.send({ status: 'ok', message: 'Doctor List backend is running' });
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/doctors', doctor_routes_1.default);
app.use('/api/v1/hospitals', hospital_routes_1.default);
app.use('/api/v1/appointments', appointment_routes_1.default);
app.use('/api/v1/ambulance', ambulance_routes_1.default);
app.use('/api/v1/ambulance-requests', ambulance_request_routes_1.default);
app.use('/api/v1/banners', banner_routes_1.default);
app.use('/api/v1/upload', upload_routes_1.default);
app.use('/api/v1/blood-banks', blood_bank_routes_1.default);
app.use('/api/v1/physiotherapy-centers', physiotherapy_center_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/eye-care-centers', eye_care_center_routes_1.default);
app.use('/api/v1/hearing-aid-centers', hearing_aid_center_routes_1.default);
app.use('/api/v1/dental-clinics', dental_clinic_routes_1.default);
app.use('/api/v1/drug-rehabilitation-centers', drug_rehabilitation_center_routes_1.default);
app.use('/api/v1/disease-categories', disease_category_routes_1.default);
app.use('/api/v1/departments', department_routes_1.default);
// Alias: admin dashboard uses /diseases, Flutter uses /disease-categories — both point to same handler
app.use('/api/v1/diseases', disease_category_routes_1.default);
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
exports.default = app;
