const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Class = require('../models/Class');
const ClassSession = require('../models/ClassSession');
const Staff = require('../models/Staff');
const Member = require('../models/Member');

// @route   POST api/classes
// @desc    Create a new class
// @access  Private
router.post('/', [
  auth,
  tenant,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('duration', 'Duration is required').isNumeric(),
    check('capacity', 'Capacity is required').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user has admin or manager role
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to create classes' });
  }

  try {
    const { 
      name, 
      description, 
      category, 
      duration, 
      capacity, 
      difficulty, 
      equipment, 
      image, 
      isActive 
    } = req.body;

    // Create new class
    const newClass = new Class({
      gym: req.gymId, // Add gym reference for multi-tenancy
      name,
      description: description || '',
      category,
      duration: Number(duration),
      capacity: Number(capacity),
      difficulty: difficulty || 'beginner',
      equipment: equipment || '',
      image: image || '',
      isActive: isActive !== undefined ? isActive : true
    });

    const savedClass = await newClass.save();
    res.json(savedClass);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes
// @desc    Get all classes
// @access  Private
router.get('/', auth, tenant, async (req, res) => {
  try {
    let query;
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all classes across all gyms
      query = {};
    } else {
      // Filter by gym ID for non-superadmin users
      query = { gym: req.gymId };
    }
    
    const classes = await Class.find(query).sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/classes/:id
// @desc    Update a class
// @access  Private
router.put('/:id', [
  auth,
  tenant,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('duration', 'Duration is required').isNumeric(),
    check('capacity', 'Capacity is required').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user has admin or manager role
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to update classes' });
  }

  try {
    // Find the class
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    let classItem = await Class.findOne(query);
    if (!classItem) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    const { 
      name, 
      description, 
      category, 
      duration, 
      capacity, 
      difficulty, 
      equipment, 
      image, 
      isActive 
    } = req.body;

    // Update class fields
    classItem.name = name;
    classItem.description = description || classItem.description;
    classItem.category = category;
    classItem.duration = Number(duration);
    classItem.capacity = Number(capacity);
    classItem.difficulty = difficulty || classItem.difficulty;
    classItem.equipment = equipment !== undefined ? equipment : classItem.equipment;
    classItem.image = image !== undefined ? image : classItem.image;
    classItem.isActive = isActive !== undefined ? isActive : classItem.isActive;

    const updatedClass = await classItem.save();
    res.json(updatedClass);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/classes/:id
// @desc    Delete a class
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  // Check if user has admin or manager role
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to delete classes' });
  }

  try {
    // Find the class
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    // Check if there are any sessions for this class
    const sessions = await ClassSession.find({ class: req.params.id });
    if (sessions.length > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete a class with existing sessions. Please delete all sessions first or mark the class as inactive instead.' 
      });
    }

    await Class.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Class deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/:id
// @desc    Get class by ID
// @access  Private
router.get('/:id', auth, tenant, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/classes
// @desc    Create a class
// @access  Private
router.post(
  '/',
  [
    auth,
    tenant,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('duration', 'Duration is required').isNumeric(),
      check('capacity', 'Capacity is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if class with name already exists
      let existingClass = await Class.findOne({ name: req.body.name });
      if (existingClass) {
        return res.status(400).json({ msg: 'Class with this name already exists' });
      }

      const newClass = new Class({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        duration: req.body.duration,
        capacity: req.body.capacity,
        difficulty: req.body.difficulty || 'all_levels',
        equipment: req.body.equipment || [],
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        image: req.body.image
      });

      await newClass.save();

      res.json(newClass);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/classes/:id
// @desc    Update a class
// @access  Private
router.put('/:id', auth, tenant, async (req, res) => {
  try {
    let classItem = await Class.findOne({
      _id: req.params.id,
      gym: req.gymId
    });

    if (!classItem) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    // Check if another class with the same name exists
    if (req.body.name && req.body.name !== classItem.name) {
      const existingClass = await Class.findOne({ name: req.body.name });
      if (existingClass) {
        return res.status(400).json({ msg: 'Class with this name already exists' });
      }
    }

    // Update class data
    const updateData = { ...req.body, updatedAt: Date.now() };

    classItem = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/classes/:id
// @desc    Delete a class
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    // Check if there are any sessions for this class
    const sessions = await ClassSession.find({ class: req.params.id });
    if (sessions.length > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete class with existing sessions. Deactivate it instead.' 
      });
    }

    await classItem.remove();

    res.json({ msg: 'Class removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/category/:category
// @desc    Get classes by category
// @access  Private
router.get('/category/:category', auth, tenant, async (req, res) => {
  try {
    const classes = await Class.find({ 
      category: req.params.category,
      isActive: true
    }).sort({ name: 1 });

    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/sessions
// @desc    Get all class sessions
// @access  Private
router.get('/sessions/all', auth, tenant, async (req, res) => {
  try {
    let query;
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all class sessions across all gyms
      query = {};
    } else {
      // Filter by gym ID for non-superadmin users
      query = { gym: req.gymId };
    }
    
    const sessions = await ClassSession.find(query)
      .populate('class', 'name category duration')
      .populate('instructor', 'firstName lastName')
      .sort({ startTime: 1 });
    
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/sessions/:id
// @desc    Get class session by ID
// @access  Private
router.get('/sessions/:id', auth, tenant, async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.id)
      .populate('class', 'name category duration difficulty')
      .populate('instructor', 'firstName lastName')
      .populate('enrolledMembers.member', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ msg: 'Class session not found' });
    }

    res.json(session);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class session not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/classes/sessions
// @desc    Create a class session
// @access  Private
router.post(
  '/sessions',
  [
    auth,
    tenant,
    [
      check('class', 'Class is required').not().isEmpty(),
      check('instructor', 'Instructor is required').not().isEmpty(),
      check('startTime', 'Start time is required').not().isEmpty(),
      check('endTime', 'End time is required').not().isEmpty(),
      check('room', 'Room is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if class exists
      let classQuery = { _id: req.body.class };
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        classQuery.gym = req.gymId;
      }
      const classObj = await Class.findOne(classQuery);
      if (!classObj) {
        return res.status(404).json({ msg: 'Class not found' });
      }

      // Check if instructor exists
      let instructorQuery = { _id: req.body.instructor };
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        instructorQuery.gym = req.gymId;
      }
      const instructor = await Staff.findOne(instructorQuery);
      if (!instructor) {
        return res.status(404).json({ msg: 'Instructor not found' });
      }

      // Check if instructor is actually a trainer
      if (instructor.position !== 'trainer') {
        return res.status(400).json({ msg: 'Selected staff member is not a trainer' });
      }

      // Check for time conflicts with the same room
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(req.body.endTime);

      // Validate that end time is after start time
      if (endTime <= startTime) {
        return res.status(400).json({ msg: 'End time must be after start time' });
      }

      // Check for room conflicts
      const roomConflict = await ClassSession.findOne({
        room: req.body.room,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (roomConflict) {
        return res.status(400).json({ msg: 'Room is already booked for this time slot' });
      }

      // Check for instructor conflicts within this gym
      const instructorConflict = await ClassSession.findOne({
        gym: req.gymId,
        instructor: req.body.instructor,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (instructorConflict) {
        return res.status(400).json({ msg: 'Instructor is already scheduled for this time slot' });
      }

      const session = new ClassSession({
        class: req.body.class,
        instructor: req.body.instructor,
        startTime: startTime,
        endTime: endTime,
        room: req.body.room,
        maxCapacity: req.body.maxCapacity || classObj.capacity,
        status: req.body.status || 'scheduled',
        notes: req.body.notes,
        enrolledMembers: []
      });

      await session.save();

      const populatedSession = await ClassSession.findById(session._id)
        .populate('class', 'name category duration')
        .populate('instructor', 'firstName lastName');

      res.json(populatedSession);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/classes/sessions/:id
// @desc    Update a class session
// @access  Private
router.put('/sessions/:id', auth, tenant, async (req, res) => {
  try {
    let session = await ClassSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Class session not found' });
    }

    // If changing class, check if it exists
    if (req.body.class && req.body.class !== session.class.toString()) {
      let classQuery = { _id: req.body.class };
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        classQuery.gym = req.gymId;
      }
      const classItem = await Class.findOne(classQuery);
      if (!classItem) {
        return res.status(404).json({ msg: 'Class not found' });
      }
    }

    // If changing instructor, check if they exist and are a trainer
    if (req.body.instructor && req.body.instructor !== session.instructor.toString()) {
      let instructorQuery = { _id: req.body.instructor };
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== 'superadmin') {
        instructorQuery.gym = req.gymId;
      }
      const instructor = await Staff.findOne(instructorQuery);
      if (!instructor) {
        return res.status(404).json({ msg: 'Instructor not found' });
      }
      if (instructor.position !== 'trainer') {
        return res.status(400).json({ msg: 'Selected staff member is not a trainer' });
      }
    }

    // If changing time or room, check for conflicts
    if ((req.body.startTime && req.body.startTime !== session.startTime.toISOString()) ||
        (req.body.endTime && req.body.endTime !== session.endTime.toISOString()) ||
        (req.body.room && req.body.room !== session.room)) {
      
      const startTime = req.body.startTime ? new Date(req.body.startTime) : session.startTime;
      const endTime = req.body.endTime ? new Date(req.body.endTime) : session.endTime;
      const room = req.body.room || session.room;

      // Validate that end time is after start time
      if (endTime <= startTime) {
        return res.status(400).json({ msg: 'End time must be after start time' });
      }

      // Check for room conflicts
      const roomConflict = await ClassSession.findOne({
        _id: { $ne: req.params.id },
        room: room,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (roomConflict) {
        return res.status(400).json({ msg: 'Room is already booked for this time slot' });
      }

      // Check for instructor conflicts
      const instructor = req.body.instructor || session.instructor;
      const instructorConflict = await ClassSession.findOne({
        _id: { $ne: req.params.id },
        instructor: instructor,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (instructorConflict) {
        return res.status(400).json({ msg: 'Instructor is already scheduled for this time slot' });
      }
    }

    // Update session data
    const updateData = { ...req.body, updatedAt: Date.now() };

    session = await ClassSession.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate('class', 'name category duration')
      .populate('instructor', 'firstName lastName');

    res.json(session);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class session not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/sessions/:id
// @desc    Get class session by ID
// @access  Private
router.get('/sessions/:id', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    const session = await ClassSession.findOne(query)
      .populate('class', 'name category duration difficulty')
      .populate('instructor', 'firstName lastName')
      .populate('enrolledMembers.member', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ msg: 'Class session not found' });
    }

    res.json(session);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class session not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/classes/sessions/:id/attendance/:memberId
// @desc    Mark attendance for a member in a class session
// @access  Private
router.put('/sessions/:id/attendance/:memberId', auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    const session = await ClassSession.findOne(query);
    if (!session) {
      return res.status(404).json({ msg: 'Class session not found' });
    }

    // Find the member enrollment
    const memberEnrollment = session.enrolledMembers.find(
      enrollment => enrollment.member.toString() === req.params.memberId
    );

    if (!memberEnrollment) {
      return res.status(404).json({ msg: 'Member not enrolled in this session' });
    }

    // Update attendance status
    memberEnrollment.attended = req.body.attended;
    
    // Save the updated session
    await session.save();

    const updatedSession = await ClassSession.findById(req.params.id)
      .populate('class', 'name category duration')
      .populate('instructor', 'firstName lastName')
      .populate('enrolledMembers.member', 'firstName lastName email');

    res.json(updatedSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/sessions/date/:date
// @desc    Get class sessions for a specific date
// @access  Private
router.get('/sessions/date/:date', auth, tenant, async (req, res) => {
  try {
    // Parse the date from the URL parameter
    const requestDate = new Date(req.params.date);
    
    // Set time to start of day
    requestDate.setHours(0, 0, 0, 0);
    
    // Set time to end of day
    const endOfDay = new Date(requestDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Build query for sessions on the requested date
    let query = {
      startTime: { $gte: requestDate, $lte: endOfDay }
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    // Find sessions on the requested date
    const sessions = await ClassSession.find(query)
      .populate('class', 'name category duration')
      .populate('instructor', 'firstName lastName')
      .sort({ startTime: 1 });
    
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions by date:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
