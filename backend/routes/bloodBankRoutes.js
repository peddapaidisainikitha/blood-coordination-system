const express = require('express');
const router = express.Router();
const {
  getNearbyBloodBanks,
  getAllBloodBanks,
  getBloodBankById,
  searchByBloodGroup,
  addBloodBank,
  updateInventory,
  getInventory
} = require('../controllers/bloodBankController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', getNearbyBloodBanks);
router.get('/search', searchByBloodGroup);
router.get('/', getAllBloodBanks);
router.get('/:id', getBloodBankById);
router.get('/:id/inventory', getInventory);
router.post('/', protect, authorize('admin', 'superadmin'), addBloodBank);
router.put('/:id/inventory', protect, authorize('admin', 'superadmin', 'moderator'), updateInventory);

module.exports = router;
