const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const Membership = require('../models/Membership');
const moment = require('moment');

// @route   GET api/reports/revenue
// @desc    Get revenue reports by time period
// @access  Private
router.get('/revenue', auth, tenant, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    console.log('Revenue Report Request:', { period, startDate, endDate, user: req.user.email, gymId: req.gymId });
    let start, end, groupBy;
    
    // Check if we have any payments in the system (for debugging)
    const totalPaymentsInSystem = await Payment.countDocuments({});
    console.log(`Total payments in system: ${totalPaymentsInSystem}`);
    
    // Set time period for the report
    if (period === 'daily') {
      // Default to last 30 days if no dates provided
      start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(30, 'days').startOf('day').toDate();
      end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
      
      console.log('Daily period date range:', { 
        start: start.toISOString(), 
        end: end.toISOString() 
      });
      
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
    } else if (period === 'weekly') {
      // Default to last 12 weeks if no dates provided
      start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(12, 'weeks').startOf('day').toDate();
      end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
      
      console.log('Weekly period date range:', { 
        start: start.toISOString(), 
        end: end.toISOString() 
      });
      
      groupBy = { $dateToString: { format: '%Y-%U', date: '$paymentDate' } };
    } else if (period === 'monthly') {
      // Default to last 12 months if no dates provided
      start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(12, 'months').startOf('month').toDate();
      end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
      
      console.log('Monthly period date range:', { 
        start: start.toISOString(), 
        end: end.toISOString() 
      });
      
      groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
    } else {
      // Default to monthly if period is invalid
      start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(12, 'months').startOf('month').toDate();
      end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
      
      console.log('Default period (monthly) date range:', { 
        start: start.toISOString(), 
        end: end.toISOString() 
      });
      
      groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
    }
    
    // Query payments within date range
    let revenueData;
    
    if (period === 'daily') {
      // Create match object for aggregation
      const matchObj = {
        paymentDate: { $gte: start, $lte: end }
      };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        matchObj.gym = req.gymId;
      }
      
      console.log('Revenue Report Daily Query:', { 
        matchObj, 
        startDate: start.toISOString(), 
        endDate: end.toISOString(),
        gymId: req.gymId
      });
      
      revenueData = await Payment.aggregate([
        {
          $match: matchObj
        },
        {
          $group: {
            _id: groupBy,
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);
      
      // Format the response for daily
      revenueData = revenueData.map(item => ({
        date: item._id,
        totalRevenue: item.totalRevenue,
        count: item.count
      }));
    } else if (period === 'weekly' || period === 'monthly') {
      // Create match object for aggregation
      const matchObj = {
        paymentDate: { $gte: start, $lte: end }
      };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        matchObj.gym = req.gymId;
      }
      
      console.log('Revenue Report Weekly/Monthly Query:', { 
        period,
        matchObj, 
        startDate: start.toISOString(), 
        endDate: end.toISOString(),
        gymId: req.gymId
      });
      
      // Check how many payments match our criteria
      const matchingPaymentsCount = await Payment.countDocuments(matchObj);
      console.log(`Found ${matchingPaymentsCount} payments matching criteria`);
      
      // If no payments found, try to diagnose the issue
      if (matchingPaymentsCount === 0) {
        // Check for payments with this gym
        const gymPayments = await Payment.find({gym: req.gymId}).limit(5);
        console.log('Sample payments for this gym:', 
          gymPayments.map(p => ({
            id: p._id,
            date: new Date(p.paymentDate).toISOString(),
            amount: p.amount,
            status: p.paymentStatus
          }))
        );
        
        // Check payments within date range regardless of gym
        const dateRangePayments = await Payment.find({
          paymentDate: { $gte: start, $lte: end }
        }).limit(5);
        
        console.log('Sample payments in date range (any gym):', 
          dateRangePayments.map(p => ({
            id: p._id,
            date: new Date(p.paymentDate).toISOString(),
            gym: p.gym,
            amount: p.amount
          }))
        );
      }
      
      // Use appropriate aggregation based on period
      revenueData = await Payment.aggregate([
        {
          $match: matchObj
        },
        {
          $project: {
            _id: 1,
            paymentDate: 1,
            amount: { $ifNull: ['$amount', 0] }, // Handle null amounts
            periodKey: period === 'monthly' 
              ? { $dateToString: { format: '%Y-%m', date: '$paymentDate' } }
              : (period === 'weekly' 
                ? { $dateToString: { format: '%Y-%U', date: '$paymentDate' } }
                : { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } })
          }
        },
        {
          $group: {
            _id: '$periodKey',
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // Debug the raw aggregation results
      console.log('Raw aggregation results:', JSON.stringify(revenueData));
      
      // Format the response for weekly/monthly
      revenueData = revenueData.map(item => {
        let date = item._id; // Default to the _id which should already be formatted correctly
        
        if (period === 'weekly' && item._id) {
          // For weekly reports, format as Week YYYY-WW
          const parts = item._id.split('-');
          if (parts.length === 2) {
            date = `Week ${parts[1]}, ${parts[0]}`;
          }
        } else if (period === 'monthly' && item._id) {
          // For monthly reports, format as Month YYYY
          const parts = item._id.split('-');
          if (parts.length === 2) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthIndex = parseInt(parts[1]) - 1;
            date = `${monthNames[monthIndex]} ${parts[0]}`;
          }
        }
        
        return {
          date,
          totalRevenue: item.totalRevenue,
          count: item.count
        };
      });
    }
    
    // Get total revenue for the period
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalPayments = revenueData.reduce((sum, item) => sum + item.count, 0);
    
    console.log('Revenue Report Results:', { 
      dataLength: revenueData.length,
      totalRevenue,
      totalPayments,
      sampleData: revenueData.slice(0, 2) // Show first 2 items if available
    });
    
    res.json({
      period,
      startDate: start,
      endDate: end,
      totalRevenue,
      totalPayments,
      data: revenueData
    });
  } catch (err) {
    console.error('Error generating revenue report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/membership
// @desc    Get membership reports
// @access  Private
router.get('/membership', auth, tenant, async (req, res) => {
  try {
    // Get membership distribution
    // Create match object for aggregation
    const matchObj = {
      membershipStatus: 'active'
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      matchObj.gym = req.gymId;
    }
    
    const membershipDistribution = await Member.aggregate([
      {
        $match: matchObj
      },
      {
        $lookup: {
          from: 'memberships',
          localField: 'membershipType',
          foreignField: '_id',
          as: 'membershipInfo'
        }
      },
      {
        $unwind: {
          path: '$membershipInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$membershipInfo.name',
          count: { $sum: 1 },
          revenue: { $sum: '$membershipInfo.price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Format the response
    const formattedDistribution = membershipDistribution.map(item => ({
      name: item._id || 'No Membership',
      count: item.count,
      revenue: item.revenue || 0
    }));
    
    // Get membership growth over time (last 6 months)
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month').toDate();
    
    // Create match object for membership growth
    const growthMatchObj = {
      createdAt: { $gte: sixMonthsAgo }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      growthMatchObj.gym = req.gymId;
    }
    
    const membershipGrowth = await Member.aggregate([
      {
        $match: growthMatchObj
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newMembers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Format the growth data
    const formattedGrowth = membershipGrowth.map(item => ({
      date: moment().year(item._id.year).month(item._id.month - 1).startOf('month').format('YYYY-MM'),
      newMembers: item.newMembers
    }));
    
    // Get total active and inactive members
    // Create query objects for active and inactive members
    const activeQuery = { membershipStatus: 'active' };
    const inactiveQuery = { membershipStatus: 'inactive' };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      activeQuery.gym = req.gymId;
      inactiveQuery.gym = req.gymId;
    }
    
    const totalActiveMembers = await Member.countDocuments(activeQuery);
    const totalInactiveMembers = await Member.countDocuments(inactiveQuery);
    
    res.json({
      totalActiveMembers,
      totalInactiveMembers,
      distribution: formattedDistribution,
      growth: formattedGrowth
    });
  } catch (err) {
    console.error('Error generating membership report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/attendance
// @desc    Get attendance reports
// @access  Private
router.get('/attendance', auth, tenant, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    console.log('Attendance Report Request:', { period, startDate, endDate, user: req.user.email, gymId: req.gymId });
    let start, end, groupBy;
    
    // Set time period for the report
    if (period === 'daily') {
      // Default to last 30 days if no dates provided
      start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
      // Set start time to beginning of day
      start.setHours(0, 0, 0, 0);
      
      end = endDate ? new Date(endDate) : new Date();
      // Set end time to end of day
      end.setHours(23, 59, 59, 999);
      
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } };
      
      console.log('Attendance Report Daily Period:', { 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      });
    } else if (period === 'weekly') {
      // Default to last 12 weeks if no dates provided
      start = startDate ? new Date(startDate) : moment().subtract(12, 'weeks').toDate();
      // Set start time to beginning of day
      start.setHours(0, 0, 0, 0);
      
      end = endDate ? new Date(endDate) : new Date();
      // Set end time to end of day
      end.setHours(23, 59, 59, 999);
      
      groupBy = { $week: { $dateFromString: { dateString: { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } } } } };
    } else if (period === 'monthly') {
      // Default to last 12 months if no dates provided
      start = startDate ? new Date(startDate) : moment().subtract(12, 'months').toDate();
      // Set start time to beginning of day
      start.setHours(0, 0, 0, 0);
      
      end = endDate ? new Date(endDate) : new Date();
      // Set end time to end of day
      end.setHours(23, 59, 59, 999);
      
      groupBy = { $dateToString: { format: '%Y-%m', date: '$checkInTime' } };
    } else {
      // Default to daily if period is invalid
      start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
      // Set start time to beginning of day
      start.setHours(0, 0, 0, 0);
      
      end = endDate ? new Date(endDate) : new Date();
      // Set end time to end of day
      end.setHours(23, 59, 59, 999);
      
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } };
    }
    
    // Query attendance within date range
    let attendanceData;
    
    // Create match object for aggregation
    const matchObj = {
      checkInTime: { $gte: start, $lte: end }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      matchObj.gym = req.gymId;
    }
    
    console.log('Attendance Report Query:', { 
      period,
      matchObj, 
      startDate: start.toISOString(), 
      endDate: end.toISOString(),
      gymId: req.gymId
    });
    
    // Add a debugging stage to see what documents are being processed
    const debugResults = await Attendance.find(matchObj).limit(10);
    console.log('Matching attendance documents before aggregation:', 
      debugResults.map(a => ({
        id: a._id,
        date: a.checkInTime,
        formattedDate: a.checkInTime ? new Date(a.checkInTime).toISOString() : 'null'
      }))
    );
    
    // Use a simpler aggregation pipeline to debug
    if (period === 'daily') {
      attendanceData = await Attendance.aggregate([
        {
          $match: matchObj
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    } else if (period === 'weekly') {
      attendanceData = await Attendance.aggregate([
        {
          $match: matchObj
        },
        {
          $group: {
            _id: { $week: { $dateFromString: { dateString: { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } } } } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    } else { // monthly or default
      attendanceData = await Attendance.aggregate([
        {
          $match: matchObj
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$checkInTime' } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    }
    
    // Debug the raw aggregation results
    console.log('Raw attendance aggregation results:', JSON.stringify(attendanceData));
    
    // Format the response for weekly/monthly
    attendanceData = attendanceData.map(item => {
      let date;
      if (period === 'weekly') {
        // For weekly reports
        if (item._id && typeof item._id === 'number') {
          // If _id is just the week number
          date = `Week ${item._id}`;
        } else {
          // Try to format as best we can
          date = `Week ${item._id}`;
        }
      } else if (period === 'monthly') {
        // For monthly reports
        if (item._id && typeof item._id === 'string') {
          // If _id is already a formatted string like '2025-07'
          date = item._id;
        } else if (item._id && item._id.year && item._id.month) {
          // If _id has year and month properties
          date = moment().year(item._id.year).month(item._id.month - 1).startOf('month').format('YYYY-MM');
        } else {
          // Fallback
          date = String(item._id);
        }
      } else {
        // Daily or fallback
        date = String(item._id);
      }
      
      return {
        date,
        count: item.count
      };
    });
    
    // Get busiest hours (time of day)
    // Create match object for busiest hours
    const hoursMatchObj = {
      checkInTime: { $gte: start, $lte: end }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      hoursMatchObj.gym = req.gymId;
    }
    
    const busiestHours = await Attendance.aggregate([
      {
        $match: hoursMatchObj
      },
      {
        $group: {
          _id: { $hour: '$checkInTime' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    // Format busiest hours
    const formattedBusiestHours = busiestHours.map(item => ({
      hour: item._id,
      count: item.count
    }));
    
    // Get busiest days of week
    // Create match object for busiest days
    const daysMatchObj = {
      checkInTime: { $gte: start, $lte: end }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      daysMatchObj.gym = req.gymId;
    }
    
    const busiestDays = await Attendance.aggregate([
      {
        $match: daysMatchObj
      },
      {
        $group: {
          _id: { $dayOfWeek: '$checkInTime' }, // 1 for Sunday, 2 for Monday, etc.
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    // Format busiest days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedBusiestDays = busiestDays.map(item => ({
      day: dayNames[item._id - 1],
      count: item.count
    }));
    
    // Get total check-ins for the period
    const totalCheckins = attendanceData.reduce((sum, item) => sum + item.count, 0);
    
    console.log('Attendance Report Results:', { 
      dataLength: attendanceData.length,
      totalCheckins,
      sampleData: attendanceData.slice(0, 2) // Show first 2 items if available
    });
    
    res.json({
      period,
      startDate: start,
      endDate: end,
      totalCheckins,
      data: attendanceData,
      busiestHours: formattedBusiestHours,
      busiestDays: formattedBusiestDays
    });
  } catch (err) {
    console.error('Error generating attendance report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/classes
// @desc    Get class performance reports
// @access  Private
router.get('/classes', auth, tenant, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get class attendance by class type
    // Create match object for class attendance
    const classMatchObj = {
      startTime: { $gte: start, $lte: end }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      classMatchObj.gym = req.gymId;
    }
    
    const classAttendance = await ClassSession.aggregate([
      {
        $match: classMatchObj
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: {
          path: '$classInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$classInfo.name',
          sessions: { $sum: 1 },
          totalAttendance: { $sum: { $size: '$enrolledMembers' } },
          averageAttendance: { $avg: { $size: '$enrolledMembers' } }
        }
      },
      {
        $sort: { totalAttendance: -1 }
      }
    ]);
    
    // Format class attendance
    const formattedClassAttendance = classAttendance.map(item => ({
      className: item._id || 'Unknown Class',
      sessions: item.sessions,
      totalAttendance: item.totalAttendance,
      averageAttendance: Math.round(item.averageAttendance * 10) / 10 // Round to 1 decimal place
    }));
    
    // Get instructor performance
    // Create match object for instructor performance
    const instructorMatchObj = {
      startTime: { $gte: start, $lte: end }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      instructorMatchObj.gym = req.gymId;
    }
    
    const instructorPerformance = await ClassSession.aggregate([
      {
        $match: instructorMatchObj
      },
      {
        $lookup: {
          from: 'staff',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorInfo'
        }
      },
      {
        $unwind: {
          path: '$instructorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            id: '$instructorInfo._id',
            name: { $concat: ['$instructorInfo.firstName', ' ', '$instructorInfo.lastName'] }
          },
          sessions: { $sum: 1 },
          totalAttendance: { $sum: { $size: '$enrolledMembers' } },
          averageAttendance: { $avg: { $size: '$enrolledMembers' } }
        }
      },
      {
        $sort: { totalAttendance: -1 }
      }
    ]);
    
    // Format instructor performance
    const formattedInstructorPerformance = instructorPerformance.map(item => ({
      instructorId: item._id.id || 'unknown',
      instructorName: item._id.name || 'Unknown Instructor',
      sessions: item.sessions,
      totalAttendance: item.totalAttendance,
      averageAttendance: Math.round(item.averageAttendance * 10) / 10 // Round to 1 decimal place
    }));
    
    // Get total sessions and attendance
    const totalSessions = formattedClassAttendance.reduce((sum, item) => sum + item.sessions, 0);
    const totalClassAttendance = formattedClassAttendance.reduce((sum, item) => sum + item.totalAttendance, 0);
    
    res.json({
      startDate: start,
      endDate: end,
      totalSessions,
      totalAttendance: totalClassAttendance,
      classPerformance: formattedClassAttendance,
      instructorPerformance: formattedInstructorPerformance
    });
  } catch (err) {
    console.error('Error generating class report:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
