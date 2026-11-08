const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getRequestById,
  respondToRequest,
  cancelRequest,
  getRequestsForDonor,
  getAllRequests
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('patient'), createRequest);
router.get('/my-requests', protect, authorize('patient'), getMyRequests);
router.get('/for-donor', protect, authorize('donor'), getRequestsForDonor);
router.get('/', protect, authorize('admin', 'superadmin', 'moderator'), getAllRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id/respond', protect, authorize('donor'), respondToRequest);
router.put('/:id/cancel', protect, cancelRequest);

module.exports = router;
