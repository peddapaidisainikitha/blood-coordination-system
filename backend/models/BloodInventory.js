const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: [0, 'Units cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'low', 'unavailable', 'critical'],
    default: 'unavailable'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'system'
  },
  expiryDate: { type: Date }
}, { timestamps: true });

// Auto-set status based on units
bloodInventorySchema.pre('save', function (next) {
  if (this.units <= 0) {
    this.status = 'unavailable';
  } else if (this.units <= 2) {
    this.status = 'critical';
  } else if (this.units <= 5) {
    this.status = 'low';
  } else {
    this.status = 'available';
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);
