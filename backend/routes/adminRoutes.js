const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  verifyDonor,
  verifyBloodBank,
  deactivateUser,
  getAllUsers,
  flagDuplicateRequest,
  createAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication
router.use(protect);
router.use(authorize('admin', 'superadmin', 'moderator'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/donors/:id/verify', verifyDonor);
router.put('/blood-banks/:id/verify', verifyBloodBank);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/requests/:id/flag-duplicate', flagDuplicateRequest);
router.post('/create', authorize('superadmin'), createAdmin);

module.exports = router;
