const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Membership = require('../models/Membership');

// @route   GET api/payments
// @desc    Get all payments
// @access  Private
router.get('/', auth, tenant, async (req, res) => {
  try {
    let query;
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all payments across all gyms
      query = {};
    } else {
      // Filter by gym ID for non-superadmin users
      query = { gym: req.gymId };
    }
    
    const payments = await Payment.find(query)
      .populate('member', 'firstName lastName email')
      .populate('membership', 'name price')
      .populate('staff', 'firstName lastName position')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const payment = await Payment.findOne(query)
      .populate('member', 'firstName lastName email')
      .populate('membership', 'name price')
      .populate('staff', 'firstName lastName position')
      .populate('createdBy', 'name');

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/payments
// @desc    Create a payment
// @access  Private
router.post(
  '/',
  [
    auth,
    tenant,
    [
      check('member', 'Member is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric(),
      check('paymentMethod', 'Payment method is required').not().isEmpty(),
      // Conditionally require staff for personal training payments
      check('staff').custom((value, { req }) => {
        if (req.body.paymentFor === 'personal_training' && !value) {
          throw new Error('Staff member is required for personal training payments');
        }
        return true;
      })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if member exists
      let memberQuery = { _id: req.body.member };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        memberQuery.gym = req.gymId;
      }
      
      const member = await Member.findOne(memberQuery);
      if (!member) {
        return res.status(404).json({ msg: 'Member not found' });
      }

      // Check if membership exists if provided
      if (req.body.membership) {
        let membershipQuery = { _id: req.body.membership };
        
        // Add gym filter for non-superadmin users
        if (req.user && req.user.role !== 'superadmin') {
          membershipQuery.gym = req.gymId;
        }
        
        const membership = await Membership.findOne(membershipQuery);
        if (!membership) {
          return res.status(404).json({ msg: 'Membership not found' });
        }
      }

      // Generate invoice number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `INV-${year}${month}${day}-${randomNum}`;

      const payment = new Payment({
        gym: req.gymId, // Add gym reference for multi-tenancy
        member: req.body.member,
        membership: req.body.membership,
        amount: req.body.amount,
        paymentDate: req.body.paymentDate || Date.now(),
        paymentMethod: req.body.paymentMethod,
        paymentStatus: req.body.paymentStatus || 'completed',
        transactionId: req.body.transactionId,
        invoiceNumber: invoiceNumber,
        description: req.body.description,
        paymentFor: req.body.paymentFor || 'membership',
        // Only include staff if it's provided (required for personal_training)
        ...(req.body.staff ? { staff: req.body.staff } : {}),
        createdBy: req.user.id
      });

      await payment.save();

      // If this is a membership payment with a membership ID, update the member's membership info
      if (req.body.paymentFor === 'membership' && req.body.membership) {
        const membership = await Membership.findOne({
          _id: req.body.membership,
          gym: req.gymId
        });
        
        // Calculate new end date based on membership duration
        let startDate = new Date();
        if (member.endDate && member.endDate > startDate) {
          // If current membership hasn't expired, extend from the end date
          startDate = new Date(member.endDate);
        }
        
        let endDate = new Date(startDate);
        if (membership.duration.unit === 'days') {
          endDate.setDate(endDate.getDate() + membership.duration.value);
        } else if (membership.duration.unit === 'weeks') {
          endDate.setDate(endDate.getDate() + (membership.duration.value * 7));
        } else if (membership.duration.unit === 'months') {
          endDate.setMonth(endDate.getMonth() + membership.duration.value);
        } else if (membership.duration.unit === 'years') {
          endDate.setFullYear(endDate.getFullYear() + membership.duration.value);
        }
        
        // Update member
        member.membershipType = req.body.membership;
        member.membershipStatus = 'active';
        member.endDate = endDate;
        await member.save();
      }

      const populatedPayment = await Payment.findById(payment._id)
        .populate('member', 'firstName lastName email')
        .populate('membership', 'name price')
        .populate('staff', 'firstName lastName position')
        .populate('createdBy', 'name');

      res.json(populatedPayment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/payments/:id
// @desc    Update a payment
// @access  Private
router.put('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    let payment = await Payment.findOne(query);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    // Check if member exists if changing
    if (req.body.member && req.body.member !== payment.member.toString()) {
      const member = await Member.findOne({
        _id: req.body.member,
        gym: req.gymId
      });
      if (!member) {
        return res.status(404).json({ msg: 'Member not found' });
      }
    }

    // Check if membership exists if changing
    if (req.body.membership && req.body.membership !== payment.membership?.toString()) {
      const membership = await Membership.findById(req.body.membership);
      if (!membership) {
        return res.status(404).json({ msg: 'Membership not found' });
      }
    }

    // Update payment data
    const updateData = { ...req.body, updatedAt: Date.now() };

    payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate('member', 'firstName lastName email')
      .populate('membership', 'name price')
      .populate('staff', 'firstName lastName position')
      .populate('createdBy', 'name');

    res.json(payment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/payments/:id
// @desc    Delete a payment
// @access  Private
router.delete('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const payment = await Payment.findOne(query);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    await Payment.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Payment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payments/member/:memberId
// @desc    Get payments by member ID
// @access  Private
router.get('/member/:memberId', auth, tenant, async (req, res) => {
  try {
    let query = { member: req.params.memberId };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const payments = await Payment.find(query)
      .populate('member', 'firstName lastName email')
      .populate('membership', 'name price')
      .populate('staff', 'firstName lastName position')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payments/date-range
// @desc    Get payments within a date range
// @access  Private
router.get('/date-range', auth, tenant, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'Start date and end date are required' });
    }
    
    let query = {
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const payments = await Payment.find(query)
      .populate('member', 'firstName lastName email')
      .populate('membership', 'name price')
      .populate('staff', 'firstName lastName position')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payments/stats/monthly/:year
// @desc    Get monthly payment statistics for a year
// @access  Private
router.get('/stats/monthly/:year', auth, tenant, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    // Create aggregation pipeline to get monthly totals
    let query = [
      {
        $match: {
          paymentDate: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query[0].$match.gym = req.gymId;
    }
    
    const monthlyStats = await Payment.aggregate(query);
    
    // Format the response to include all months
    const formattedStats = Array.from({ length: 12 }, (_, index) => {
      const monthData = monthlyStats.find(stat => stat._id === index + 1);
      return {
        month: index + 1,
        total: monthData ? monthData.total : 0,
        count: monthData ? monthData.count : 0
      };
    });
    
    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
