const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ msg: 'Account is inactive. Please contact administrator.' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Return jsonwebtoken with gym info for multi-tenancy
      const payload = {
        user: {
          id: user.id,
          role: user.role,
          gym: user.gym
        }
      };

      // Use environment variable or fallback to a default secret
      const jwtSecret = process.env.JWT_SECRET || 'mysecretjwtkey';

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

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('gym', 'name logo contactEmail'); // Populate gym info for multi-tenancy
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Generate reset token
      // Use environment variable or fallback to a default reset secret
      const jwtResetSecret = process.env.JWT_RESET_SECRET || 'myresetjwtkey';
      
      const resetToken = jwt.sign(
        { id: user.id },
        jwtResetSecret,
        { expiresIn: '1h' }
      );

      // Save to database
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
      await user.save();

      // TODO: Send email with reset link
      // This would typically use nodemailer or similar service

      res.json({ msg: 'Password reset email sent' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post(
  '/reset-password/:token',
  [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid or expired token' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
