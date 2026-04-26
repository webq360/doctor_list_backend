"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function seed() {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    const User = mongoose_1.default.model('User', new mongoose_1.default.Schema({
        name: String,
        email: { type: String, unique: true },
        phone: { type: String, unique: true },
        password: String,
        role: String,
        isActive: Boolean,
    }));
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminadmin';
    const adminPhone = process.env.ADMIN_PHONE || '01700000000';
    const adminName = process.env.ADMIN_NAME || 'Admin';
    const existing = await User.findOne({ email: adminEmail });
    const hashed = await bcryptjs_1.default.hash(adminPassword, 12);
    if (existing) {
        await User.updateOne({ email: adminEmail }, { $set: { password: hashed, role: 'admin' } });
        console.log(`✅ Admin user updated: ${adminEmail} / ${adminPassword}`);
    }
    else {
        await User.create({
            name: adminName,
            email: adminEmail,
            phone: adminPhone,
            password: hashed,
            role: 'admin',
            isActive: true,
        });
        console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    }
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
