const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const donorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  age: {
    type: Number,
    min: [18, 'Donor must be at least 18 years old'],
    max: [65, 'Donor must be 65 years or younger']
  },
  weight: {
    type: Number,
    min: [45, 'Minimum weight for donation is 45 kg']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  lastDonationDate: { type: Date },
  medicalConditions: { type: String, default: 'None' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  totalDonations: { type: Number, default: 0 },
  profileImage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
}, { timestamps: true });

donorSchema.index({ location: '2dsphere' });

// Eligibility check: must be 56+ days since last donation
donorSchema.methods.isEligibleToDonate = function () {
  if (!this.lastDonationDate) return true;
  const daysSinceLast = (Date.now() - new Date(this.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLast >= 56;
};

donorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

donorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Donor', donorSchema);
