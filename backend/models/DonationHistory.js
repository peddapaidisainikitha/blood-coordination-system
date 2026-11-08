const mongoose = require('mongoose');

const donationHistorySchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyRequest'
  },
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  units: {
    type: Number,
    default: 1,
    min: [1, 'Must donate at least 1 unit']
  },
  donationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    name: { type: String },
    address: { type: String },
    city: { type: String }
  },
  donationType: {
    type: String,
    enum: ['emergency', 'voluntary', 'camp'],
    default: 'emergency'
  },
  certificate: { type: String },
  notes: { type: String },
  verifiedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DonationHistory', donationHistorySchema);
