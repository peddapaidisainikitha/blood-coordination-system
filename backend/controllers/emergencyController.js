const EmergencyRequest = require('../models/EmergencyRequest');
const Donor = require('../models/Donor');
const DonationHistory = require('../models/DonationHistory');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getCompatibleDonors } = require('../utils/bloodCompatibility');
const { sendEmergencyAlert, sendStatusUpdate } = require('../utils/notifications');

// @desc    Create emergency blood request
// @route   POST /api/emergency
const createRequest = async (req, res) => {
  try {
    const {
      patientName, bloodGroup, unitsRequired, urgencyLevel,
      hospital, contactPhone, additionalNotes, location
    } = req.body;

    // Duplicate detection: same requester, same blood group, within 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const existingRequest = await EmergencyRequest.findOne({
      requester: req.user._id,
      bloodGroup,
      status: { $in: ['pending', 'active'] },
      createdAt: { $gte: twoHoursAgo }
    });

    if (existingRequest) {
      existingRequest.duplicateFlags += 1;
      if (existingRequest.duplicateFlags >= 3) existingRequest.isDuplicate = true;
      await existingRequest.save();

      return res.status(409).json({
        success: false,
        message: 'A similar active request already exists. Please wait or check your existing request.',
        existingRequestId: existingRequest._id
      });
    }

    const request = await EmergencyRequest.create({
      requester: req.user._id,
      patientName,
      bloodGroup,
      unitsRequired,
      urgencyLevel: urgencyLevel || 'urgent',
      hospital,
      contactPhone,
      additionalNotes,
      location,
      status: 'active'
    });

    // Find nearby compatible donors and notify them
    const compatibleGroups = getCompatibleDonors(bloodGroup);
    const searchCoords = location?.coordinates || [0, 0];

    let nearbyDonors = [];
    if (searchCoords[0] !== 0 && searchCoords[1] !== 0) {
      nearbyDonors = await Donor.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: searchCoords },
            distanceField: 'distance',
            maxDistance: 50000, // 50km radius
            spherical: true,
            query: {
              isActive: true,
              isVerified: true,
              'availability.isAvailable': true,
              bloodGroup: { $in: compatibleGroups }
            }
          }
        },
        { $limit: 10 }
      ]);
    } else {
      // Fallback: find available compatible donors without geo-filter
      nearbyDonors = await Donor.find({
        isActive: true,
        isVerified: true,
        'availability.isAvailable': true,
        bloodGroup: { $in: compatibleGroups }
      }).limit(10);
    }

    const notificationPromises = nearbyDonors.map(async (donor) => {
      // Add to notified donors list
      request.notifiedDonors.push({ donor: donor._id });

      // Create in-app notification
      await Notification.create({
        recipient: donor._id,
        recipientModel: 'Donor',
        type: 'emergency_request',
        title: `🩸 Emergency: ${bloodGroup} Blood Needed`,
        message: `${patientName} needs ${unitsRequired} unit(s) of ${bloodGroup} blood at ${hospital.name}, ${hospital.city}.`,
        relatedRequest: request._id
      });

      // Send email/SMS alert
      return sendEmergencyAlert(donor, request);
    });

    await Promise.allSettled(notificationPromises);
    await request.save();

    res.status(201).json({
      success: true,
      message: `Emergency request created. ${nearbyDonors.length} donor(s) notified.`,
      data: request,
      notifiedCount: nearbyDonors.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get requests for logged-in patient
// @route   GET /api/emergency/my-requests
const getMyRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find({ requester: req.user._id })
      .populate('fulfilledBy', 'name phone bloodGroup email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single request by ID
// @route   GET /api/emergency/:id
const getRequestById = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id)
      .populate('requester', 'name email phone')
      .populate('notifiedDonors.donor', 'name bloodGroup')
      .populate('fulfilledBy', 'name phone bloodGroup');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Donor responds to a request (accept/decline)
// @route   PUT /api/emergency/:id/respond
const respondToRequest = async (req, res) => {
  try {
    const { response } = req.body; // 'accepted' or 'declined'
    const donorId = req.user._id;

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'active') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // Find donor in notified list
    const notifiedEntry = request.notifiedDonors.find(
      entry => entry.donor.toString() === donorId.toString()
    );

    if (!notifiedEntry) {
      // Add donor even if not in original notify list (e.g., voluntary response)
      request.notifiedDonors.push({
        donor: donorId,
        response,
        responseAt: new Date()
      });
    } else {
      notifiedEntry.response = response;
      notifiedEntry.responseAt = new Date();
    }

    if (response === 'accepted') {
      // Verify eligibility
      const donor = await Donor.findById(donorId);
      if (!donor.isEligibleToDonate()) {
        return res.status(400).json({
          success: false,
          message: 'You are not eligible to donate yet. Minimum 56 days between donations.'
        });
      }

      request.status = 'fulfilled';
      request.fulfilledBy = donorId;
      request.fulfilledAt = new Date();

      // Update donor's last donation date and count
      donor.lastDonationDate = new Date();
      donor.totalDonations += 1;
      await donor.save({ validateBeforeSave: false });

      // Log donation history
      await DonationHistory.create({
        donor: donorId,
        request: request._id,
        bloodGroup: donor.bloodGroup,
        donationDate: new Date(),
        location: {
          name: request.hospital.name,
          address: request.hospital.address,
          city: request.hospital.city
        },
        donationType: 'emergency'
      });

      // Notify the requester
      const requester = await User.findById(request.requester);
      if (requester) {
        await Notification.create({
          recipient: requester._id,
          recipientModel: 'User',
          type: 'request_accepted',
          title: 'Donor Found!',
          message: `A donor has accepted your blood request for ${request.patientName}.`,
          relatedRequest: request._id
        });
        sendStatusUpdate(requester, request, 'accepted');
      }
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: `Request ${response} successfully`,
      data: { status: request.status, response }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a request
// @route   PUT /api/emergency/:id/cancel
const cancelRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only requester or admin can cancel
    if (
      request.requester.toString() !== req.user._id.toString() &&
      req.userType !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    if (['fulfilled', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({ success: true, message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active requests for donor (blood-group compatible ones nearby)
// @route   GET /api/emergency/for-donor
const getRequestsForDonor = async (req, res) => {
  try {
    const donor = req.user;
    const compatibleGroups = getCompatibleDonors(donor.bloodGroup);

    const requests = await EmergencyRequest.find({
      status: 'active',
      bloodGroup: { $in: compatibleGroups }
    })
      .select('patientName bloodGroup unitsRequired urgencyLevel hospital location contactPhone status createdAt')
      .sort({ urgencyLevel: 1, createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all requests (admin)
// @route   GET /api/emergency
const getAllRequests = async (req, res) => {
  try {
    const { status, bloodGroup, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const requests = await EmergencyRequest.find(filter)
      .populate('requester', 'name email phone')
      .populate('fulfilledBy', 'name phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await EmergencyRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  respondToRequest,
  cancelRequest,
  getRequestsForDonor,
  getAllRequests
};
