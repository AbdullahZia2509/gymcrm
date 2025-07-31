const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'staff', 'trainer'],
    default: 'staff'
  },
  gym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  avatar: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model('User', UserSchema);
