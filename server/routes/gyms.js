const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Gym = require('../models/Gym');
const User = require('../models/User');

// Middleware to check if user is superadmin
const isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Access denied. Superadmin privileges required.' });
    }
    next();
  } catch (err) {
    console.error('Superadmin check error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   GET api/gyms
// @desc    Get all gyms
// @access  Private (superadmin only)
router.get('/', [auth, isSuperAdmin], async (req, res) => {
  try {
    const gyms = await Gym.find().sort({ name: 1 });
    res.json(gyms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/gyms/:id
// @desc    Get gym by ID
// @access  Private (superadmin only)
router.get('/:id', [auth, isSuperAdmin], async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ msg: 'Gym not found' });
    }

    res.json(gym);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Gym not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/gyms
// @desc    Create a gym
// @access  Private (superadmin only)
router.post(
  '/',
  [
    auth,
    isSuperAdmin,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('contactEmail', 'Valid email is required').isEmail()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newGym = new Gym({
        name: req.body.name,
        description: req.body.description,
        address: req.body.address,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        logo: req.body.logo,
        website: req.body.website,
        businessHours: req.body.businessHours,
        settings: req.body.settings || {}
      });

      const gym = await newGym.save();
      res.json(gym);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/gyms/:id
// @desc    Update a gym
// @access  Private (superadmin only)
router.put('/:id', [auth, isSuperAdmin], async (req, res) => {
  try {
    let gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ msg: 'Gym not found' });
    }

    // Update fields
    const updateData = {
      ...req.body,
      updatedAt: Date.now()
    };

    gym = await Gym.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(gym);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Gym not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/gyms/:id
// @desc    Delete a gym
// @access  Private (superadmin only)
router.delete('/:id', [auth, isSuperAdmin], async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ msg: 'Gym not found' });
    }

    // Check if there are users associated with this gym
    const usersCount = await User.countDocuments({ gym: req.params.id });
    if (usersCount > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete gym with associated users. Please reassign or delete users first.' 
      });
    }

    await gym.remove();
    res.json({ msg: 'Gym removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Gym not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/gyms/:id/users
// @desc    Get all users for a specific gym
// @access  Private (superadmin only)
router.get('/:id/users', [auth, isSuperAdmin], async (req, res) => {
  try {
    const users = await User.find({ gym: req.params.id })
      .select('-password')
      .sort({ name: 1 });
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
