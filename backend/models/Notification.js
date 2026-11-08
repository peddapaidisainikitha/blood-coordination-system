const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel',
    required: true
  },
  recipientModel: {
    type: String,
    enum: ['User', 'Donor'],
    required: true
  },
  type: {
    type: String,
    enum: ['emergency_request', 'request_accepted', 'request_declined', 'request_fulfilled',
           'verification', 'system', 'reminder'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyRequest'
  },
  isRead: { type: Boolean, default: false },
  channel: {
    email: { sent: Boolean, sentAt: Date },
    sms: { sent: Boolean, sentAt: Date },
    push: { sent: Boolean, sentAt: Date }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
