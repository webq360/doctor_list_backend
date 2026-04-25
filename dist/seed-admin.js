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
    const existing = await User.findOne({ email: 'admin@gmail.com' });
    if (existing) {
        const hashed = await bcryptjs_1.default.hash('adminadmin', 12);
        await User.updateOne({ email: 'admin@gmail.com' }, { $set: { password: hashed, role: 'admin' } });
        console.log('✅ Admin user updated: admin@gmail.com / adminadmin');
    }
    else {
        const hashed = await bcryptjs_1.default.hash('adminadmin', 12);
        await User.create({
            name: 'Admin',
            email: 'admin@gmail.com',
            phone: '01700000000',
            password: hashed,
            role: 'admin',
            isActive: true,
        });
        console.log('✅ Admin user created: admin@gmail.com / adminadmin');
    }
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
