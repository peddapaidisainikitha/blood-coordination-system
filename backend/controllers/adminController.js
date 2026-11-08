const User = require('../models/User');
const Donor = require('../models/Donor');
const Admin = require('../models/Admin');
const BloodBank = require('../models/BloodBank');
const EmergencyRequest = require('../models/EmergencyRequest');
const DonationHistory = require('../models/DonationHistory');
const Notification = require('../models/Notification');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      verifiedDonors,
      totalBloodBanks,
      activeRequests,
      fulfilledRequests,
      totalDonations,
      pendingVerificationDonors,
      pendingVerificationBanks,
      duplicateRequests
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Donor.countDocuments(),
      Donor.countDocuments({ isVerified: true }),
      BloodBank.countDocuments({ isActive: true }),
      EmergencyRequest.countDocuments({ status: 'active' }),
      EmergencyRequest.countDocuments({ status: 'fulfilled' }),
      DonationHistory.countDocuments(),
      Donor.countDocuments({ isVerified: false }),
      BloodBank.countDocuments({ isVerified: false }),
      EmergencyRequest.countDocuments({ isDuplicate: true })
    ]);

    // Blood group distribution among donors
    const bloodGroupStats = await Donor.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Requests over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRequests = await EmergencyRequest.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDonors,
        verifiedDonors,
        totalBloodBanks,
        activeRequests,
        fulfilledRequests,
        totalDonations,
        pendingVerificationDonors,
        pendingVerificationBanks,
        duplicateRequests,
        bloodGroupStats,
        recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify a donor account
// @route   PUT /api/admin/donors/:id/verify
const verifyDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    // Notify donor
    await Notification.create({
      recipient: donor._id,
      recipientModel: 'Donor',
      type: 'verification',
      title: 'Account Verified',
      message: 'Your donor account has been verified. You can now receive emergency requests.'
    });

    res.status(200).json({ success: true, message: 'Donor verified successfully', data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify a blood bank
// @route   PUT /api/admin/blood-banks/:id/verify
const verifyBloodBank = async (req, res) => {
  try {
    const bank = await BloodBank.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!bank) return res.status(404).json({ success: false, message: 'Blood bank not found' });
    res.status(200).json({ success: true, message: 'Blood bank verified', data: bank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate a user/donor account
// @route   PUT /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  try {
    const { userType } = req.body;
    const Model = userType === 'donor' ? Donor : User;
    const user = await Model.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (patients)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'patient' };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);

    res.status(200).json({ success: true, count: users.length, total, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Flag / unflag duplicate request
// @route   PUT /api/admin/requests/:id/flag-duplicate
const flagDuplicateRequest = async (req, res) => {
  try {
    const { isDuplicate } = req.body;
    const request = await EmergencyRequest.findByIdAndUpdate(
      req.params.id,
      { isDuplicate },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (isDuplicate) {
      request.status = 'cancelled';
      await request.save();
    }

    res.status(200).json({
      success: true,
      message: isDuplicate ? 'Request flagged as duplicate and cancelled' : 'Request unflagged',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create admin account (superadmin only)
// @route   POST /api/admin/create
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin email already exists' });
    }
    const admin = await Admin.create({ name, email, password, role: role || 'admin', phone });
    res.status(201).json({ success: true, message: 'Admin created', data: { id: admin._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  verifyDonor,
  verifyBloodBank,
  deactivateUser,
  getAllUsers,
  flagDuplicateRequest,
  createAdmin
};
