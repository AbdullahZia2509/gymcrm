const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Staff = require('../models/Staff');

// @route   POST api/users
// @desc    Register a user
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Role is required').isIn(['admin', 'manager', 'staff', 'trainer'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ msg: 'Not authorized to create users' });
    }

    const { name, email, password, role, staff, avatar, gym } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // If staff ID is provided, check if it exists
      if (staff) {
        const staffMember = await Staff.findById(staff);
        if (!staffMember) {
          return res.status(404).json({ msg: 'Staff member not found' });
        }
      }

      user = new User({
        name,
        email,
        password,
        role,
        staff,
        avatar,
        // If gym is provided in request, use it; otherwise use the admin's gym
        gym: gym || req.user.gym,
        isActive: true
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };

      // Use JWT_SECRET from env or fallback to a default (for development only)
      const jwtSecret = process.env.JWT_SECRET || 'gym_crm_jwt_secret_key_2023';
      
      jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  // Check if user is admin or manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to view all users' });
  }

  try {
    // Build query based on user role
    let query = {};
    
    // If not superadmin, filter by gym and exclude superadmins
    if (req.user.role !== 'superadmin') {
      query = {
        gym: req.user.gym,
        role: { $ne: 'superadmin' }
      };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('staff', 'firstName lastName position')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', auth, async (req, res) => {
  // Check if user is admin or manager, or the user is requesting their own info
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== req.params.id) {
    return res.status(403).json({ msg: 'Not authorized to view this user' });
  }

  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('staff', 'firstName lastName position');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // If not superadmin, ensure user belongs to same gym and is not a superadmin
    if (req.user.role !== 'superadmin' && 
        (user.role === 'superadmin' || 
         (user.gym && user.gym.toString() !== req.user.gym.toString()))) {
      return res.status(403).json({ msg: 'Not authorized to view this user' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  // Check if user is admin or manager, or the user is updating their own info
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== req.params.id) {
    return res.status(403).json({ msg: 'Not authorized to update this user' });
  }

  // If changing role, must be admin
  if (req.body.role && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to change user role' });
  }

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
    }

    // Update fields
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.role) updateData.role = req.body.role;
    if (req.body.staff) updateData.staff = req.body.staff;
    if (req.body.avatar) updateData.avatar = req.body.avatar;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    updateData.updatedAt = Date.now();

    // If password is provided, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to delete users' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Don't allow deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ msg: 'Cannot delete the last admin user' });
      }
    }

    await user.remove();

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/:id/change-password',
  [
    auth,
    [
      check('currentPassword', 'Current password is required').exists(),
      check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is changing their own password or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to change this user\'s password' });
    }

    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // If not admin, verify current password
      if (req.user.role !== 'admin' || req.user.id === req.params.id) {
        const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);

        if (!isMatch) {
          return res.status(400).json({ msg: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.newPassword, salt);
      user.updatedAt = Date.now();

      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/users/role/:role
// @desc    Get users by role
// @access  Private/Admin
router.get('/role/:role', auth, async (req, res) => {
  // Check if user is admin or manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to view users by role' });
  }

  try {
    // Build query based on user role
    let query = { 
      role: req.params.role,
      isActive: true
    };
    
    // If not superadmin, filter by gym and prevent access to superadmin users
    if (req.user.role !== 'superadmin') {
      query.gym = req.user.gym;
      
      // Don't allow regular admins to query for superadmins
      if (req.params.role === 'superadmin') {
        return res.status(403).json({ msg: 'Not authorized to view superadmin users' });
      }
    }

    const users = await User.find(query)
      .select('-password')
      .populate('staff', 'firstName lastName position')
      .sort({ name: 1 });
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
