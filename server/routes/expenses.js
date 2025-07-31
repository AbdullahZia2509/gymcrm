const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @route   GET api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', [auth, tenant], async (req, res) => {
  try {
    // Build query based on user role and gym
    let query = {};
    
    // If not superadmin, filter by gym
    if (req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }

    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Add category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name')
      .populate('paidBy', 'name')
      .populate('staff', 'firstName lastName')
      .sort({ date: -1 });
    
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', [auth, tenant], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('paidBy', 'name')
      .populate('staff', 'firstName lastName');

    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }

    // Check if user has access to this expense (same gym or superadmin)
    if (req.user.role !== 'superadmin' && expense.gym.toString() !== req.gymId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to access this expense' });
    }

    res.json(expense);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/expenses
// @desc    Create a new expense
// @access  Private
router.post(
  '/',
  [
    auth,
    tenant,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('amount', 'Amount is required and must be a number').isNumeric(),
      check('category', 'Category is required').isIn([
        'salary', 'bills', 'maintenance', 'equipment', 'rent', 'supplies', 'marketing', 'misc'
      ])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        amount,
        date,
        category,
        description,
        paymentMethod,
        receiptImage,
        recurring,
        recurringFrequency,
        nextDueDate,
        status,
        paidBy,
        paidTo,
        staff
      } = req.body;

      // Create new expense object
      const newExpense = new Expense({
        title,
        amount,
        date: date || Date.now(),
        category,
        description,
        paymentMethod,
        receiptImage,
        recurring: recurring || false,
        recurringFrequency: recurring ? recurringFrequency : 'none',
        nextDueDate,
        status: status || 'paid',
        paidBy: paidBy || req.user.id,
        paidTo,
        // Only include staff if it's not an empty string
        ...(staff ? { staff } : {}),
        gym: req.gymId,
        createdBy: req.user.id
      });

      const expense = await newExpense.save();
      res.json(expense);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', [auth, tenant], async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }

    // Check if user has access to this expense (same gym or superadmin)
    if (req.user.role !== 'superadmin' && expense.gym.toString() !== req.gymId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this expense' });
    }

    // Only admin, manager, or the creator can update expenses
    if (req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        req.user.role !== 'superadmin' && 
        expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this expense' });
    }

    const {
      title,
      amount,
      date,
      category,
      description,
      paymentMethod,
      receiptImage,
      recurring,
      recurringFrequency,
      nextDueDate,
      status,
      paidBy,
      paidTo,
      staff
    } = req.body;

    // Build expense update object
    const expenseFields = {};
    if (title) expenseFields.title = title;
    if (amount) expenseFields.amount = amount;
    if (date) expenseFields.date = date;
    if (category) expenseFields.category = category;
    if (description !== undefined) expenseFields.description = description;
    if (paymentMethod) expenseFields.paymentMethod = paymentMethod;
    if (receiptImage !== undefined) expenseFields.receiptImage = receiptImage;
    if (recurring !== undefined) expenseFields.recurring = recurring;
    if (recurringFrequency) expenseFields.recurringFrequency = recurringFrequency;
    if (nextDueDate) expenseFields.nextDueDate = nextDueDate;
    if (status) expenseFields.status = status;
    if (paidBy) expenseFields.paidBy = paidBy;
    if (paidTo !== undefined) expenseFields.paidTo = paidTo;
    
    // Handle staff field - if empty string, remove the field
    if (staff === '') {
      expenseFields.$unset = { staff: 1 };
    } else if (staff) {
      expenseFields.staff = staff;
    }
    
    expenseFields.updatedBy = req.user.id;
    expenseFields.updatedAt = Date.now();

    // Update expense
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: expenseFields },
      { new: true }
    );

    res.json(expense);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', [auth, tenant], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }

    // Check if user has access to this expense (same gym or superadmin)
    if (req.user.role !== 'superadmin' && expense.gym.toString() !== req.gymId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this expense' });
    }

    // Only admin, manager, or the creator can delete expenses
    if (req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        req.user.role !== 'superadmin' && 
        expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this expense' });
    }

    await expense.remove();
    res.json({ msg: 'Expense removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenses/summary/monthly
// @desc    Get monthly expense summary
// @access  Private
router.get('/summary/monthly', [auth, tenant], async (req, res) => {
  try {
    // Get year and month from query params or use current year/month
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) - 1 : new Date().getMonth(); // JS months are 0-indexed
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of the month
    
    // Build query based on user role and gym
    let query = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    // If not superadmin, filter by gym
    if (req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }

    // Aggregate expenses by category
    const categorySummary = await Expense.aggregate([
      { $match: query },
      { $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get total expenses for the month
    const totalExpenses = await Expense.aggregate([
      { $match: query },
      { $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      month: month + 1,
      year,
      categorySummary,
      total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      count: totalExpenses.length > 0 ? totalExpenses[0].count : 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenses/summary/category
// @desc    Get expense summary by category
// @access  Private
router.get('/summary/category', [auth, tenant], async (req, res) => {
  try {
    // Get date range from query params or use current month
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    // Build query based on user role and gym
    let query = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    // If not superadmin, filter by gym
    if (req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }

    // Aggregate expenses by category
    const categorySummary = await Expense.aggregate([
      { $match: query },
      { $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      startDate,
      endDate,
      categorySummary
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
