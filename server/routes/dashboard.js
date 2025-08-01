const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Class = require('../models/Class');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const moment = require('moment');

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('Dashboard stats API called');
    
    // Check if user is superadmin or has a gym assigned
    const isSuperAdmin = req.user && req.user.role === 'superadmin';
    const gymId = req.user && req.user.gym;
    
    // For regular users, ensure we have a gym ID
    if (!isSuperAdmin && !gymId) {
      return res.status(400).json({ msg: 'User gym not found' });
    }
    
    console.log('User role:', req.user.role);
    console.log('Is superadmin:', isSuperAdmin);
    console.log('User gym ID:', gymId || 'None (superadmin)');
    
    // Get current date in local timezone
    const today = new Date();
    console.log('Raw today date:', today);
    
    // Create date objects for start and end of day in local timezone
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    // Get current year and month
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed (0 = January)
    
    // Create date objects for first and last day of current month in local timezone
    // This ensures we're matching the same timezone used when creating payments/expenses
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    console.log('Current month/year:', currentMonth + 1, '/', currentYear);
    console.log('Today date (local):', startOfDay);
    console.log('First day of current month (local):', firstDayOfMonth);
    console.log('Last day of current month (local):', lastDayOfMonth);
    
    // Get first day of previous month in local timezone
    const firstDayOfPrevMonth = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
    const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    console.log('Previous month date range:', firstDayOfPrevMonth, 'to', lastDayOfPrevMonth);
    
    // Use default values in case of errors
    let activeMembers = 0;
    let activeClasses = 0;
    let checkInsToday = 0;
    let upcomingSessions = 0;
    let totalRevenue = 0;
    let membershipGrowth = 0;
    let feesDueCount = 0;
    let monthlyExpenses = 0;
    
    try {
      // Active members count - filtered by gym for regular users
      const memberQuery = { membershipStatus: 'active' };
      if (!isSuperAdmin) {
        memberQuery.gym = gymId;
      }
      activeMembers = await Member.countDocuments(memberQuery);
      console.log('Active members:', activeMembers);
    } catch (err) {
      console.error('Error fetching active members:', err.message);
    }
    
    try {
      // Active classes count - filtered by gym for regular users
      const classQuery = { isActive: true };
      if (!isSuperAdmin) {
        classQuery.gym = gymId;
      }
      activeClasses = await Class.countDocuments(classQuery);
      console.log('Active classes:', activeClasses);
    } catch (err) {
      console.error('Error fetching active classes:', err.message);
    }
    
    try {
      // Check-ins for today using local timezone dates - filtered by gym for regular users
      const attendanceQuery = {
        checkInTime: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      };
      if (!isSuperAdmin) {
        attendanceQuery.gym = gymId;
      }
      checkInsToday = await Attendance.countDocuments(attendanceQuery);
      console.log('Check-ins today:', checkInsToday);
    } catch (err) {
      console.error('Error fetching check-ins:', err.message);
    }
    
    try {
      // Upcoming sessions (future sessions from now) - filtered by gym for regular users
      const sessionQuery = {
        startTime: { $gte: today }
      };
      if (!isSuperAdmin) {
        sessionQuery.gym = gymId;
      }
      upcomingSessions = await ClassSession.countDocuments(sessionQuery);
      console.log('Upcoming sessions:', upcomingSessions);
    } catch (err) {
      console.error('Error fetching upcoming sessions:', err.message);
    }
    
    try {
      // Total revenue for current month
      console.log('Querying payments', isSuperAdmin ? 'for all gyms' : `for gym: ${gymId}`);
      
      // Set up payment query - filtered by gym for regular users
      const paymentQuery = {};
      if (!isSuperAdmin) {
        paymentQuery.gym = gymId;
      }
      
      // Get all payments for this gym/all gyms first (for debugging)
      const allGymPayments = await Payment.find(paymentQuery);
      console.log('All payments count:', allGymPayments.length);
      console.log('All payments sample:', JSON.stringify(allGymPayments.slice(0, 5).map(p => ({ 
        id: p._id, 
        amount: p.amount, 
        date: p.paymentDate,
        gym: p.gym
      }))));
      
      // Now get current month payments - between first and last day of current month
      const currentMonthQuery = {
        paymentDate: { 
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      };
      if (!isSuperAdmin) {
        currentMonthQuery.gym = gymId;
      }
      
      const currentMonthPayments = await Payment.find(currentMonthQuery);
      
      console.log('Current month payments count:', currentMonthPayments.length);
      console.log('Current month payments:', JSON.stringify(currentMonthPayments.map(p => ({ 
        id: p._id, 
        amount: p.amount, 
        date: new Date(p.paymentDate).toISOString()
      }))));
      
      // Calculate total revenue with validation
      totalRevenue = currentMonthPayments.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0;
        return sum + amount;
      }, 0);
      
      console.log('Total revenue calculated:', totalRevenue);
    } catch (err) {
      console.error('Error fetching revenue:', err.message);
      // Set default value in case of error
      totalRevenue = 0;
    }
    
    try {
      // Get current date for more detailed logging
      const now = new Date();
      console.log('Current date:', now);
      console.log('First day of month:', firstDayOfMonth);
      
      // Log query info for debugging
      console.log('Querying expenses', isSuperAdmin ? 'for all gyms' : `for gym: ${gymId}`);
      
      // Set up expense query - filtered by gym for regular users
      const expenseQuery = {};
      if (!isSuperAdmin) {
        expenseQuery.gym = gymId;
      }
      
      // Query all expenses for this gym/all gyms
      const allGymExpenses = await Expense.find(expenseQuery);
      console.log('All expenses count:', allGymExpenses.length);
      console.log('All expenses sample:', JSON.stringify(allGymExpenses.slice(0, 5).map(e => ({ 
        id: e._id, 
        amount: e.amount, 
        date: e.date,
        gym: e.gym
      }))));
      
      // Total expenses for current month - between first and last day of current month
      const currentMonthQuery = {
        date: { 
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth 
        }
      };
      if (!isSuperAdmin) {
        currentMonthQuery.gym = gymId;
      }
      
      const currentMonthExpenses = await Expense.find(currentMonthQuery);
      
      console.log('Current month expenses count:', currentMonthExpenses.length);
      console.log('Current month expenses data:', JSON.stringify(currentMonthExpenses.map(e => ({ 
        id: e._id, 
        amount: e.amount, 
        date: new Date(e.date).toISOString() 
      }))));
      
      // Ensure we're working with valid numbers and provide a default of 0
      monthlyExpenses = currentMonthExpenses.reduce((sum, expense) => {
        const amount = Number(expense.amount) || 0;
        return sum + amount;
      }, 0);
      
      console.log('Monthly expenses calculated:', monthlyExpenses);
    } catch (err) {
      console.error('Error fetching expenses:', err.message);
      // Ensure we set a default value in case of error
      monthlyExpenses = 0;
    }
    
    try {
      // Membership growth calculation
      // Set up query - filtered by gym for regular users
      const prevMonthQuery = {
        createdAt: {
          $gte: firstDayOfPrevMonth,
          $lte: lastDayOfPrevMonth
        }
      };
      
      const currentMonthQuery = {
        createdAt: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      };
      
      if (!isSuperAdmin) {
        prevMonthQuery.gym = gymId;
        currentMonthQuery.gym = gymId;
      }
      
      const prevMonthMembers = await Member.countDocuments(prevMonthQuery);
      const currentMonthMembers = await Member.countDocuments(currentMonthQuery);
      
      console.log('Previous month members:', prevMonthMembers);
      console.log('Current month members:', currentMonthMembers);
      console.log('Previous month date range:', firstDayOfPrevMonth, 'to', lastDayOfPrevMonth);
      console.log('Current month date range:', firstDayOfMonth, 'to', lastDayOfMonth);
      
      // Instead of calculating percentage growth, just use the count of new members this month
      membershipGrowth = currentMonthMembers;
      
      console.log('New members this month:', membershipGrowth);
    } catch (err) {
      console.error('Error calculating membership growth:', err.message);
    }
    
    try {
      // Members with fees due count (membership ending within 7 days or already expired)
      const todayMoment = moment().startOf('day');
      const sevenDaysFromNow = moment().add(7, 'days').endOf('day');
      
      // Build the query
      const feesDueQuery = {
        $or: [
          // Case 1: Membership ending within 7 days
          {
            endDate: { 
              $gte: todayMoment.toDate(),
              $lte: sevenDaysFromNow.toDate() 
            },
            membershipStatus: 'active'
          },
          // Case 2: Membership already expired but status still active
          {
            endDate: { $lt: todayMoment.toDate() },
            membershipStatus: 'active'
          }
        ]
      };
      
      // Add gym filter for non-superadmin users
      if (!isSuperAdmin) {
        // We need to add gym filter to each condition in the $or array
        feesDueQuery.$or = feesDueQuery.$or.map(condition => ({
          ...condition,
          gym: gymId
        }));
      }
      
      feesDueCount = await Member.countDocuments(feesDueQuery);
      
      console.log('Members with fees due:', feesDueCount);
    } catch (err) {
      console.error('Error calculating fees due count:', err.message);
    }
    
    const responseData = {
      activeMembers,
      totalRevenue,
      activeClasses,
      checkInsToday,
      upcomingSessions,
      membershipGrowth,
      feesDueCount,
      monthlyExpenses
    };
    
    console.log('Sending dashboard stats response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
