const User = require('../models/User');
const Donor = require('../models/Donor');
const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/notifications');

// @desc    Register Patient/User
// @route   POST /api/auth/register/patient
const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, address, city, state, pincode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password, phone, bloodGroup,
      location: { address, city, state, pincode }
    });

    const token = generateToken(user._id, user.role);

    // Welcome email
    sendEmail({
      to: email,
      subject: 'Welcome to Blood Coordination System',
      html: `<p>Dear ${name}, your patient account has been created successfully.</p>`,
      text: `Dear ${name}, your patient account has been created successfully.`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register Donor
// @route   POST /api/auth/register/donor
const registerDonor = async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, age, weight, gender, address, city, state, pincode } = req.body;

    if (age < 18 || age > 65) {
      return res.status(400).json({ success: false, message: 'Donors must be between 18 and 65 years old' });
    }
    if (weight < 45) {
      return res.status(400).json({ success: false, message: 'Minimum weight for donation is 45 kg' });
    }

    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const donor = await Donor.create({
      name, email, password, phone, bloodGroup, age, weight, gender,
      location: { address, city, state, pincode }
    });

    const token = generateToken(donor._id, 'donor');

    sendEmail({
      to: email,
      subject: 'Welcome - Blood Donor Registration',
      html: `<p>Dear ${name}, thank you for registering as a blood donor. Your account is pending verification.</p>`,
      text: `Dear ${name}, thank you for registering as a blood donor.`
    });

    res.status(201).json({
      success: true,
      message: 'Donor registration successful. Account pending verification.',
      token,
      user: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        role: 'donor',
        bloodGroup: donor.bloodGroup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login - Patient / Donor / Admin
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }

    let user;
    let userRole;

    if (role === 'admin') {
      user = await Admin.findOne({ email }).select('+password');
      userRole = user ? user.role : null;
    } else if (role === 'donor') {
      user = await Donor.findOne({ email }).select('+password');
      userRole = 'donor';
    } else {
      user = await User.findOne({ email }).select('+password');
      userRole = user ? user.role : null;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, userRole);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        bloodGroup: user.bloodGroup || null,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: req.userType,
        bloodGroup: user.bloodGroup || null,
        phone: user.phone,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const role = req.userType;

    let userDoc;
    if (role === 'admin' || role === 'superadmin') {
      userDoc = await Admin.findById(req.user._id).select('+password');
    } else if (role === 'donor') {
      userDoc = await Donor.findById(req.user._id).select('+password');
    } else {
      userDoc = await User.findById(req.user._id).select('+password');
    }

    const isMatch = await userDoc.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    userDoc.password = newPassword;
    await userDoc.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerPatient, registerDonor, login, getMe, changePassword };
