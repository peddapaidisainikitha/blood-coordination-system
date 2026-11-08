const Donor = require('../models/Donor');
const DonationHistory = require('../models/DonationHistory');
const Notification = require('../models/Notification');
const { getCompatibleDonors } = require('../utils/bloodCompatibility');

// @desc    Find nearby eligible donors
// @route   GET /api/donors/nearby
const getNearbyDonors = async (req, res) => {
  try {
    const { longitude, latitude, bloodGroup, maxDistance = 30000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Location coordinates required' });
    }

    const compatibleGroups = bloodGroup ? getCompatibleDonors(bloodGroup) : undefined;

    const matchQuery = {
      isActive: true,
      isVerified: true,
      'availability.isAvailable': true
    };
    if (compatibleGroups) {
      matchQuery.bloodGroup = { $in: compatibleGroups };
    }

    const donors = await Donor.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: matchQuery
        }
      },
      {
        $project: {
          name: 1, bloodGroup: 1, location: 1, distance: 1,
          'availability.isAvailable': 1, 'availability.lastUpdated': 1,
          totalDonations: 1, lastDonationDate: 1, isVerified: 1
          // Exclude phone/email for privacy — shown only when request accepted
        }
      },
      { $limit: 30 }
    ]);

    const enriched = donors.map(d => {
      const daysSinceLast = d.lastDonationDate
        ? Math.floor((Date.now() - new Date(d.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        ...d,
        distanceKm: (d.distance / 1000).toFixed(2),
        isEligible: !d.lastDonationDate || daysSinceLast >= 56,
        daysSinceLastDonation: daysSinceLast
      };
    });

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donor profile
// @route   GET /api/donors/profile
const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user._id);
    res.status(200).json({ success: true, data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/profile
const updateDonorProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'age', 'weight', 'location', 'medicalConditions', 'gender'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const donor = await Donor.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, message: 'Profile updated', data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update availability status
// @route   PUT /api/donors/availability
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      req.user._id,
      { 'availability.isAvailable': isAvailable, 'availability.lastUpdated': new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'Available' : 'Unavailable'}`,
      data: { isAvailable: donor.availability.isAvailable, lastUpdated: donor.availability.lastUpdated }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donation history
// @route   GET /api/donors/history
const getDonationHistory = async (req, res) => {
  try {
    const history = await DonationHistory.find({ donor: req.user._id })
      .populate('request', 'patientName bloodGroup hospital urgencyLevel')
      .sort({ donationDate: -1 });

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donor notifications
// @route   GET /api/donors/notifications
const getDonorNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      recipientModel: 'Donor'
    })
      .populate('relatedRequest')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/donors/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all donors (admin)
// @route   GET /api/donors
const getAllDonors = async (req, res) => {
  try {
    const { bloodGroup, city, isVerified, isAvailable, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isAvailable !== undefined) filter['availability.isAvailable'] = isAvailable === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const donors = await Donor.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await Donor.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: donors.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: donors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNearbyDonors,
  getDonorProfile,
  updateDonorProfile,
  updateAvailability,
  getDonationHistory,
  getDonorNotifications,
  markNotificationRead,
  getAllDonors
};
