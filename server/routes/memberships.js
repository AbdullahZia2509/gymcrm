const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Membership = require('../models/Membership');

// @route   GET api/memberships
// @desc    Get all memberships
// @access  Private
router.get('/', auth, tenant, async (req, res) => {
  try {
    let query;
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all memberships across all gyms
      query = {};
    } else {
      // Filter by gym ID for non-superadmin users
      query = { gym: req.gymId };
    }
    
    const memberships = await Membership.find(query).sort({ price: 1 });
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/memberships/:id
// @desc    Get membership by ID
// @access  Private
router.get('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const membership = await Membership.findOne(query);

    if (!membership) {
      return res.status(404).json({ msg: 'Membership not found' });
    }

    res.json(membership);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Membership not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/memberships
// @desc    Create a membership
// @access  Private
router.post(
  '/',
  [
    auth,
    tenant,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('price', 'Price is required').isNumeric(),
      check('duration.value', 'Duration value is required').isNumeric(),
      check('duration.unit', 'Duration unit is required').isIn(['days', 'weeks', 'months', 'years'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Build query to check for existing membership with same name
      let existingMembershipQuery = { name: req.body.name };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        existingMembershipQuery.gym = req.gymId;
      } else {
        // For superadmin, check only within the specified gym
        existingMembershipQuery.gym = req.gymId;
      }
      
      let existingMembership = await Membership.findOne(existingMembershipQuery);
      if (existingMembership) {
        return res.status(400).json({ msg: 'Membership with this name already exists' });
      }

      const membership = new Membership({
        gym: req.gymId, // Add gym reference for multi-tenancy
        name: req.body.name,
        description: req.body.description,
        duration: {
          value: req.body.duration.value,
          unit: req.body.duration.unit
        },
        price: req.body.price,
        features: req.body.features || [],
        classesIncluded: req.body.classesIncluded || 0,
        personalTrainingIncluded: req.body.personalTrainingIncluded || 0,
        discounts: req.body.discounts || 0,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      });

      await membership.save();

      res.json(membership);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/memberships/:id
// @desc    Update a membership
// @access  Private
router.put('/:id', auth, tenant, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      gym: req.gymId
    });

    if (!membership) {
      return res.status(404).json({ msg: 'Membership not found' });
    }

    // Check if another membership with the same name exists in this gym
    if (req.body.name && req.body.name !== membership.name) {
      let existingMembershipQuery = { name: req.body.name };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        existingMembershipQuery.gym = req.gymId;
      } else {
        // For superadmin, check only within the specified gym
        existingMembershipQuery.gym = req.gymId;
      }
      
      const existingMembership = await Membership.findOne(existingMembershipQuery);
      if (existingMembership) {
        return res.status(400).json({ msg: 'Membership with this name already exists' });
      }
    }

    // Update membership data
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Handle nested duration object if provided
    if (req.body.duration) {
      if (!req.body.duration.value || !req.body.duration.unit) {
        return res.status(400).json({ msg: 'Duration must include both value and unit' });
      }
    }

    membership = await Membership.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(membership);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Membership not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/memberships/:id
// @desc    Delete a membership
// @access  Private
router.delete('/:id', auth, tenant, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      gym: req.gymId
    });

    if (!membership) {
      return res.status(404).json({ msg: 'Membership not found' });
    }

    await membership.remove();

    res.json({ msg: 'Membership removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Membership not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/memberships/active
// @desc    Get all active memberships
// @access  Private
router.get('/status/active', auth, tenant, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const memberships = await Membership.find(query).sort({ price: 1 });
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
