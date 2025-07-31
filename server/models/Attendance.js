const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  gym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  checkOutTime: {
    type: Date
  },
  duration: {
    type: Number // Duration in minutes, calculated on checkout
  },
  attendanceType: {
    type: String,
    enum: ['gym', 'class', 'personal_training'],
    default: 'gym'
  },
  classSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSession'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
