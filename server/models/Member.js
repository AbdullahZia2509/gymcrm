const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  gym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say']
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'frozen', 'expired'],
    default: 'active'
  },
  membershipType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  customFee: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  notes: {
    type: String
  },
  medicalInformation: {
    conditions: String,
    allergies: String,
    medications: String
  },
  photo: {
    type: String
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

module.exports = mongoose.model('Member', MemberSchema);
