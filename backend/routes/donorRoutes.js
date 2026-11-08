const express = require('express');
const router = express.Router();
const {
  getNearbyDonors,
  getDonorProfile,
  updateDonorProfile,
  updateAvailability,
  getDonationHistory,
  getDonorNotifications,
  markNotificationRead,
  getAllDonors
} = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', getNearbyDonors);
router.get('/', protect, authorize('admin', 'superadmin', 'moderator'), getAllDonors);
router.get('/profile', protect, authorize('donor'), getDonorProfile);
router.put('/profile', protect, authorize('donor'), updateDonorProfile);
router.put('/availability', protect, authorize('donor'), updateAvailability);
router.get('/history', protect, authorize('donor'), getDonationHistory);
router.get('/notifications', protect, authorize('donor'), getDonorNotifications);
router.put('/notifications/:id/read', protect, authorize('donor'), markNotificationRead);

module.exports = router;
