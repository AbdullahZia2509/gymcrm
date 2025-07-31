const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const ClassSession = require('../models/ClassSession');

// @route   GET api/attendance
// @desc    Get all attendance records
// @access  Private
router.get('/', auth, tenant, async (req, res) => {
  try {
    let query;
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all attendance records across all gyms
      query = {};
    } else {
      // Filter by gym ID for non-superadmin users
      query = { gym: req.gymId };
    }
    
    const attendance = await Attendance.find(query)
      .populate('member', 'firstName lastName')
      .populate({
        path: 'classSession',
        populate: {
          path: 'class',
          model: 'Class',
          select: 'name'
        }
      })
      .sort({ checkInTime: -1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/:id
// @desc    Get attendance by ID
// @access  Private
router.get('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const attendance = await Attendance.findOne(query)
      .populate('member', 'firstName lastName email')
      .populate({
        path: 'classSession',
        populate: {
          path: 'class',
          model: 'Class',
          select: 'name'
        }
      });

    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/attendance
// @desc    Create an attendance record (check-in)
// @access  Private
router.post(
  '/',
  [
    auth,
    tenant,
    [
      check('member', 'Member is required').not().isEmpty()
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

      // Check if member's membership is active
      if (member.membershipStatus !== 'active') {
        return res.status(400).json({ msg: 'Member\'s membership is not active' });
      }

      // Check if member already has an open check-in
      const existingAttendance = await Attendance.findOne({
        gym: req.gymId,
        member: req.body.member,
        checkOutTime: null
      });

      if (existingAttendance) {
        return res.status(400).json({ msg: 'Member already checked in' });
      }

      // If this is for a class, check if class session exists
      if (req.body.attendanceType === 'class' && req.body.classSession) {
        let classSessionQuery = { _id: req.body.classSession };
        
        // Add gym filter for non-superadmin users
        if (req.user && req.user.role !== 'superadmin') {
          classSessionQuery.gym = req.gymId;
        }
        
        const classSession = await ClassSession.findOne(classSessionQuery);
        if (!classSession) {
          return res.status(404).json({ msg: 'Class session not found' });
        }

        // Check if member is enrolled in the class
        const isEnrolled = classSession.enrolledMembers.some(
          enrollment => enrollment.member.toString() === req.body.member
        );

        if (!isEnrolled) {
          return res.status(400).json({ msg: 'Member is not enrolled in this class' });
        }

        // Update class session to mark member as attended
        await ClassSession.findOneAndUpdate(
          {
            _id: req.body.classSession,
            gym: req.gymId
          },
          req.body.classSession,
          {
            $set: {
              'enrolledMembers.$[elem].attended': true
            }
          },
          {
            arrayFilters: [{ 'elem.member': req.body.member }]
          }
        );
      }

      const attendance = new Attendance({
        gym: req.gymId, // Add gym reference for multi-tenancy
        member: req.body.member,
        checkInTime: req.body.checkInTime || Date.now(),
        attendanceType: req.body.attendanceType || 'gym',
        classSession: req.body.classSession,
        notes: req.body.notes,
        createdBy: req.user.id
      });

      await attendance.save();

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('member', 'firstName lastName')
        .populate({
          path: 'classSession',
          populate: {
            path: 'class',
            model: 'Class',
            select: 'name'
          }
        });

      res.json(populatedAttendance);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/attendance/checkout/:id
// @desc    Update attendance record with checkout time
// @access  Private
router.put('/checkout/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    let attendance = await Attendance.findOne(query);

    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ msg: 'Member already checked out' });
    }

    const checkOutTime = req.body.checkOutTime || Date.now();
    
    // Calculate duration in minutes
    const checkInTime = new Date(attendance.checkInTime);
    const duration = Math.round((new Date(checkOutTime) - checkInTime) / (1000 * 60));

    attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          checkOutTime: checkOutTime,
          duration: duration,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    )
      .populate('member', 'firstName lastName')
      .populate({
        path: 'classSession',
        populate: {
          path: 'class',
          model: 'Class',
          select: 'name'
        }
      });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/attendance/:id
// @desc    Delete an attendance record
// @access  Private
router.delete('/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const attendance = await Attendance.findOne(query);

    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }

    // If this was a class attendance, update the class session
    if (attendance.attendanceType === 'class' && attendance.classSession) {
      await ClassSession.findByIdAndUpdate(
        attendance.classSession,
        {
          $set: {
            'enrolledMembers.$[elem].attended': false
          }
        },
        {
          arrayFilters: [{ 'elem.member': attendance.member }]
        }
      );
    }

    await attendance.remove();

    res.json({ msg: 'Attendance record removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/member/:memberId
// @desc    Get attendance records for a specific member
// @access  Private
router.get('/member/:memberId', auth, tenant, async (req, res) => {
  try {
    let query = { member: req.params.memberId };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const attendance = await Attendance.find(query)
      .populate({
        path: 'classSession',
        populate: {
          path: 'class',
          model: 'Class',
          select: 'name'
        }
      })
      .sort({ checkInTime: -1 });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/date/:date
// @desc    Get attendance records for a specific date
// @access  Private
router.get('/date/:date', auth, tenant, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const attendance = await Attendance.find({
      checkInTime: {
        $gte: date,
        $lt: nextDay
      }
    })
      .populate('member', 'firstName lastName')
      .populate({
        path: 'classSession',
        populate: {
          path: 'class',
          model: 'Class',
          select: 'name'
        }
      })
      .sort({ checkInTime: 1 });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/active
// @desc    Get all active check-ins (no checkout time)
// @access  Private
router.get('/status/active', auth, tenant, async (req, res) => {
  try {
    let query = { checkOutTime: null };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const activeAttendance = await Attendance.find(query)
      .populate('member', 'firstName lastName')
      .populate({
        path: 'classSession',
        populate: {
          path: 'class',
          model: 'Class',
          select: 'name'
        }
      })
      .sort({ checkInTime: 1 });

    res.json(activeAttendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/stats/daily/:startDate/:endDate
// @desc    Get daily attendance stats for a date range
// @access  Private
router.get('/stats/daily/:startDate/:endDate', auth, tenant, async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(req.params.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Build match criteria for aggregation
    let matchCriteria = {
      checkInTime: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      matchCriteria.gym = req.gymId;
    }
    
    const dailyStats = await Attendance.aggregate([
      {
        $match: matchCriteria
      },
      {
        $group: {
          _id: {
            year: { $year: '$checkInTime' },
            month: { $month: '$checkInTime' },
            day: { $dayOfMonth: '$checkInTime' }
          },
          count: { $sum: 1 },
          types: {
            $push: '$attendanceType'
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);

    // Format the results
    const formattedStats = dailyStats.map(day => {
      // Count attendance by type
      const typeCount = {
        gym: 0,
        class: 0,
        personal_training: 0
      };
      
      day.types.forEach(type => {
        if (typeCount[type] !== undefined) {
          typeCount[type]++;
        }
      });

      return {
        date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
        total: day.count,
        gym: typeCount.gym,
        class: typeCount.class,
        personalTraining: typeCount.personal_training
      };
    });

    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
