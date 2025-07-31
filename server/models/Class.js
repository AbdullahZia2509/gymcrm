const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['yoga', 'cardio', 'strength', 'hiit', 'pilates', 'dance', 'martial_arts', 'other'],
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all_levels'],
    default: 'all_levels'
  },
  equipment: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
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

module.exports = mongoose.model('Class', ClassSchema);
