const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
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
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online_payment', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  transactionId: {
    type: String
  },
  invoiceNumber: {
    type: String
  },
  description: {
    type: String
  },
  paymentFor: {
    type: String,
    enum: ['membership', 'personal_training', 'merchandise', 'other'],
    default: 'membership'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    // Staff is required only for personal training payments
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

module.exports = mongoose.model('Payment', PaymentSchema);
