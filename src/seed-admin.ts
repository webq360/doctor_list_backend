import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({
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
  const hashed = await bcrypt.hash(adminPassword, 12);

  if (existing) {
    await User.updateOne({ email: adminEmail }, { $set: { password: hashed, role: 'admin' } });
    console.log(`✅ Admin user updated: ${adminEmail} / ${adminPassword}`);
  } else {
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

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
