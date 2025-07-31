const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  gym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months'
    }
  },
  price: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  classesIncluded: {
    type: Number,
    default: 0
  },
  personalTrainingIncluded: {
    type: Number,
    default: 0
  },
  discounts: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('Membership', MembershipSchema);
