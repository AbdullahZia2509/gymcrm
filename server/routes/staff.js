const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Staff = require('../models/Staff');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   GET api/staff
// @desc    Get all staff members
// @access  Private
router.get('/', auth, tenant, async (req, res) => {
  try {
    let query;
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all staff members across all gyms
      query = {};
    } else {
      // Filter by gym ID for non-superadmin users
      query = { gym: req.gymId };
    }
    
    const staff = await Staff.find(query).sort({ lastName: 1, firstName: 1 });
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/staff/:id
// @desc    Get staff member by ID
// @access  Private
router.get('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const staff = await Staff.findOne(query);

    if (!staff) {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    res.json(staff);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Staff member not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/staff
// @desc    Create a staff member
// @access  Private
router.post(
  '/',
  [
    auth,
    tenant,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone number is required').not().isEmpty(),
      check('position', 'Position is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if staff with email already exists in this gym
      let existingStaffQuery = { email: req.body.email };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        existingStaffQuery.gym = req.gymId;
      }
      
      let existingStaff = await Staff.findOne(existingStaffQuery);
      if (existingStaff) {
        return res.status(400).json({ msg: 'Staff member with this email already exists' });
      }

      const staff = new Staff({
        gym: req.gymId, // Add gym reference for multi-tenancy
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        position: req.body.position,
        specializations: req.body.specializations || [],
        certifications: req.body.certifications || [],
        hireDate: req.body.hireDate || Date.now(),
        schedule: req.body.schedule || [],
        salary: req.body.salary || {},
        address: req.body.address || {},
        emergencyContact: req.body.emergencyContact || {},
        photo: req.body.photo,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        notes: req.body.notes
      });

      await staff.save();

      // If createUser flag is set, create a user account for this staff member
      if (req.body.createUser) {
        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Determine role based on position
        let role = 'staff';
        if (req.body.position === 'manager') {
          role = 'manager';
        } else if (req.body.position === 'trainer') {
          role = 'trainer';
        }

        const user = new User({
          gym: req.gymId, // Add gym reference for multi-tenancy
          name: `${req.body.firstName} ${req.body.lastName}`,
          email: req.body.email,
          password: hashedPassword,
          role: role,
          staff: staff._id
        });

        await user.save();

        // Return staff with temporary password
        // In a real application, you would send this via email
        return res.json({
          staff,
          userCreated: true,
          tempPassword
        });
      }

      res.json(staff);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/staff/:id
// @desc    Update a staff member
// @access  Private
router.put('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    let staff = await Staff.findOne(query);

    if (!staff) {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    // Check if another staff with the same email exists
    if (req.body.email && req.body.email !== staff.email) {
      const existingStaff = await Staff.findOne({ email: req.body.email });
      if (existingStaff) {
        return res.status(400).json({ msg: 'Staff member with this email already exists' });
      }

      // If email is changing, update associated user account if it exists
      const user = await User.findOne({ staff: req.params.id });
      if (user) {
        user.email = req.body.email;
        user.name = `${req.body.firstName || staff.firstName} ${req.body.lastName || staff.lastName}`;
        await user.save();
      }
    }

    // Update staff data
    const updateData = { ...req.body, updatedAt: Date.now() };

    staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(staff);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Staff member not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/staff/:id
// @desc    Delete a staff member
// @access  Private
router.delete('/:id', auth, tenant, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    // Check if there's an associated user account
    const user = await User.findOne({ staff: req.params.id });
    if (user) {
      // Instead of deleting, deactivate the user account
      user.isActive = false;
      await user.save();
    }

    await staff.remove();

    res.json({ msg: 'Staff member removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Staff member not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/staff/position/:position
// @desc    Get staff members by position
// @access  Private
router.get('/position/:position', auth, async (req, res) => {
  try {
    let query = {
      position: req.params.position,
      isActive: true
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const staff = await Staff.find(query).sort({ lastName: 1, firstName: 1 });

    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/staff/trainers
// @desc    Get all active trainers
// @access  Private
router.get('/role/trainers', auth, tenant, async (req, res) => {
  try {
    let query = {
      position: 'trainer',
      isActive: true
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const trainers = await Staff.find(query).sort({ lastName: 1, firstName: 1 });

    res.json(trainers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/staff/:id/certification
// @desc    Add certification to staff member
// @access  Private
router.post(
  '/:id/certification',
  [
    auth,
    tenant,
    [
      check('name', 'Certification name is required').not().isEmpty(),
      check('issuedBy', 'Issuing organization is required').not().isEmpty(),
      check('issueDate', 'Issue date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const staff = await Staff.findById(req.params.id);

      if (!staff) {
        return res.status(404).json({ msg: 'Staff member not found' });
      }

      const newCertification = {
        name: req.body.name,
        issuedBy: req.body.issuedBy,
        issueDate: req.body.issueDate,
        expiryDate: req.body.expiryDate,
        document: req.body.document
      };

      staff.certifications.unshift(newCertification);
      staff.updatedAt = Date.now();

      await staff.save();

      res.json(staff);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/staff/:id/certification/:certId
// @desc    Delete certification from staff member
// @access  Private
router.delete('/:id/certification/:certId', auth, tenant, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    // Find the certification to remove
    const certIndex = staff.certifications.findIndex(
      cert => cert._id.toString() === req.params.certId
    );

    if (certIndex === -1) {
      return res.status(404).json({ msg: 'Certification not found' });
    }

    // Remove the certification
    staff.certifications.splice(certIndex, 1);
    staff.updatedAt = Date.now();

    await staff.save();

    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/staff/:id/schedule
// @desc    Add schedule entry to staff member
// @access  Private
router.post(
  '/:id/schedule',
  [
    auth,
    tenant,
    [
      check('day', 'Day is required').isIn([
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ]),
      check('startTime', 'Start time is required').not().isEmpty(),
      check('endTime', 'End time is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const staff = await Staff.findById(req.params.id);

      if (!staff) {
        return res.status(404).json({ msg: 'Staff member not found' });
      }

      // Check if schedule entry for this day already exists
      const existingIndex = staff.schedule.findIndex(
        entry => entry.day === req.body.day
      );

      if (existingIndex !== -1) {
        // Update existing entry
        staff.schedule[existingIndex] = {
          day: req.body.day,
          startTime: req.body.startTime,
          endTime: req.body.endTime
        };
      } else {
        // Add new entry
        staff.schedule.push({
          day: req.body.day,
          startTime: req.body.startTime,
          endTime: req.body.endTime
        });
      }

      staff.updatedAt = Date.now();
      await staff.save();

      res.json(staff);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/staff/:id/schedule/:day
// @desc    Delete schedule entry from staff member
// @access  Private
router.delete('/:id/schedule/:day', auth, tenant, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    // Find the schedule entry to remove
    const scheduleIndex = staff.schedule.findIndex(
      entry => entry.day === req.params.day
    );

    if (scheduleIndex === -1) {
      return res.status(404).json({ msg: 'Schedule entry not found' });
    }

    // Remove the schedule entry
    staff.schedule.splice(scheduleIndex, 1);
    staff.updatedAt = Date.now();

    await staff.save();

    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
