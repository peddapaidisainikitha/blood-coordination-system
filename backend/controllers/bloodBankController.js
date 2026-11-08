const BloodBank = require('../models/BloodBank');
const BloodInventory = require('../models/BloodInventory');

// @desc    Get nearby blood banks
// @route   GET /api/blood-banks/nearby
const getNearbyBloodBanks = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 50000, bloodGroup } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required' });
    }

    const bloodBanks = await BloodBank.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: { isActive: true, isVerified: true }
        }
      },
      { $limit: 20 }
    ]);

    // Attach inventory info
    const banksWithInventory = await Promise.all(
      bloodBanks.map(async (bank) => {
        const query = bloodGroup
          ? { bloodBank: bank._id, bloodGroup }
          : { bloodBank: bank._id };
        const inventory = await BloodInventory.find(query);
        return {
          ...bank,
          distanceKm: (bank.distance / 1000).toFixed(2),
          inventory
        };
      })
    );

    res.status(200).json({
      success: true,
      count: banksWithInventory.length,
      data: banksWithInventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all blood banks (with optional filters)
// @route   GET /api/blood-banks
const getAllBloodBanks = async (req, res) => {
  try {
    const { city, state, isVerified } = req.query;
    const filter = { isActive: true };
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (state) filter['address.state'] = new RegExp(state, 'i');
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const banks = await BloodBank.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: banks.length, data: banks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single blood bank with full inventory
// @route   GET /api/blood-banks/:id
const getBloodBankById = async (req, res) => {
  try {
    const bank = await BloodBank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }
    const inventory = await BloodInventory.find({ bloodBank: bank._id });
    res.status(200).json({ success: true, data: { ...bank.toObject(), inventory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search blood banks by blood group availability
// @route   GET /api/blood-banks/search
const searchByBloodGroup = async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;
    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required' });
    }

    const inventoryFilter = { bloodGroup, status: { $in: ['available', 'low'] } };
    const inventories = await BloodInventory.find(inventoryFilter).populate({
      path: 'bloodBank',
      match: { isActive: true, isVerified: true, ...(city ? { 'address.city': new RegExp(city, 'i') } : {}) }
    });

    const results = inventories
      .filter(inv => inv.bloodBank)
      .map(inv => ({
        bloodBank: inv.bloodBank,
        bloodGroup: inv.bloodGroup,
        units: inv.units,
        status: inv.status,
        lastUpdated: inv.lastUpdated
      }));

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new blood bank (Admin only)
// @route   POST /api/blood-banks
const addBloodBank = async (req, res) => {
  try {
    const bank = await BloodBank.create(req.body);

    // Initialize inventory for all blood groups
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    await BloodInventory.insertMany(
      bloodGroups.map(bg => ({ bloodBank: bank._id, bloodGroup: bg, units: 0 }))
    );

    res.status(201).json({ success: true, message: 'Blood bank added successfully', data: bank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update blood inventory (Admin only)
// @route   PUT /api/blood-banks/:id/inventory
const updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units, updatedBy } = req.body;

    let inventory = await BloodInventory.findOne({
      bloodBank: req.params.id,
      bloodGroup
    });

    if (!inventory) {
      inventory = new BloodInventory({ bloodBank: req.params.id, bloodGroup, units });
    } else {
      inventory.units = units;
    }

    inventory.updatedBy = updatedBy || req.user?.name || 'admin';
    await inventory.save();

    res.status(200).json({ success: true, message: 'Inventory updated', data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get full inventory for a blood bank
// @route   GET /api/blood-banks/:id/inventory
const getInventory = async (req, res) => {
  try {
    const inventory = await BloodInventory.find({ bloodBank: req.params.id });
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNearbyBloodBanks,
  getAllBloodBanks,
  getBloodBankById,
  searchByBloodGroup,
  addBloodBank,
  updateInventory,
  getInventory
};
