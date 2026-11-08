const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  unitsRequired: {
    type: Number,
    required: [true, 'Number of units required'],
    min: [1, 'At least 1 unit required']
  },
  urgencyLevel: {
    type: String,
    enum: ['critical', 'urgent', 'moderate'],
    default: 'urgent'
  },
  hospital: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    contactNumber: { type: String }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending'
  },
  contactPhone: { type: String, required: true },
  additionalNotes: { type: String },
  notifiedDonors: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
    notifiedAt: { type: Date, default: Date.now },
    response: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    responseAt: { type: Date }
  }],
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  },
  fulfilledAt: { type: Date },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  isDuplicate: { type: Boolean, default: false },
  duplicateFlags: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

emergencyRequestSchema.index({ location: '2dsphere' });
emergencyRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
