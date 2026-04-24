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

  const existing = await User.findOne({ email: 'admin@gmail.com' });
  if (existing) {
    const hashed = await bcrypt.hash('adminadmin', 12);
    await User.updateOne({ email: 'admin@gmail.com' }, { $set: { password: hashed, role: 'admin' } });
    console.log('✅ Admin user updated: admin@gmail.com / adminadmin');
  } else {
    const hashed = await bcrypt.hash('adminadmin', 12);
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

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
