const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Blood bank name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  alternatePhone: { type: String },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  operatingHours: {
    open: { type: String, default: '00:00' },
    close: { type: String, default: '23:59' },
    is24Hours: { type: Boolean, default: false }
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  website: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

bloodBankSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
