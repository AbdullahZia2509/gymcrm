const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
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
  position: {
    type: String,
    enum: ['manager', 'trainer', 'receptionist', 'maintenance', 'nutritionist', 'other'],
    required: true
  },
  specializations: [{
    type: String
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issueDate: Date,
    expiryDate: Date,
    document: String // URL to document
  }],
  hireDate: {
    type: Date,
    default: Date.now
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String
  }],
  salary: {
    amount: Number,
    paymentFrequency: {
      type: String,
      enum: ['hourly', 'weekly', 'biweekly', 'monthly']
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  photo: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
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

module.exports = mongoose.model('Staff', StaffSchema);
