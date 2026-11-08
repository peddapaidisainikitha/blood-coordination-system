/**
 * Database Seed Script
 * Creates an initial admin account and sample blood banks with inventory.
 * 
 * Run with: node utils/seedData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const BloodBank = require('../models/BloodBank');
const BloodInventory = require('../models/BloodInventory');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

const seedAdmin = async () => {
  const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', process.env.ADMIN_EMAIL);
    return;
  }
  await Admin.create({
    name: 'System Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@bloodbank.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'superadmin',
    phone: '9999999999'
  });
  console.log('✅ Admin account created:', process.env.ADMIN_EMAIL);
};

const seedBloodBanks = async () => {
  const count = await BloodBank.countDocuments();
  if (count > 0) {
    console.log(`Blood banks already exist (${count}). Skipping.`);
    return;
  }

  const banks = [
    {
      name: 'City Central Blood Bank',
      registrationNumber: 'BB-KA-001',
      email: 'citycentral@bloodbank.com',
      phone: '9876543210',
      address: { street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      operatingHours: { is24Hours: true },
      isVerified: true
    },
    {
      name: 'Apollo Hospital Blood Bank',
      registrationNumber: 'BB-KA-002',
      email: 'apollo@bloodbank.com',
      phone: '9876543211',
      address: { street: '154/11 Bannerghatta Road', city: 'Bangalore', state: 'Karnataka', pincode: '560076' },
      location: { type: 'Point', coordinates: [77.5930, 12.8929] },
      operatingHours: { open: '08:00', close: '20:00' },
      isVerified: true
    },
    {
      name: 'Government General Hospital Blood Bank',
      registrationNumber: 'BB-MH-001',
      email: 'govtgen@bloodbank.com',
      phone: '9876543212',
      address: { street: 'Victoria Terminus Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      location: { type: 'Point', coordinates: [72.8347, 18.9402] },
      operatingHours: { is24Hours: true },
      isVerified: true
    }
  ];

  for (const bankData of banks) {
    const bank = await BloodBank.create(bankData);

    // Seed random inventory
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    await BloodInventory.insertMany(bloodGroups.map(bg => ({
      bloodBank: bank._id,
      bloodGroup: bg,
      units: Math.floor(Math.random() * 15),
      updatedBy: 'seed'
    })));

    console.log(`✅ Blood bank created: ${bank.name}`);
  }
};

const run = async () => {
  try {
    await connectDB();
    await seedAdmin();
    await seedBloodBanks();
    console.log('\n🩸 Database seeding complete!\n');
    console.log('Login credentials:');
    console.log(`  Admin:  ${process.env.ADMIN_EMAIL || 'admin@bloodbank.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
