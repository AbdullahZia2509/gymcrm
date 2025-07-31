const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const Gym = require('../models/Gym');
const User = require('../models/User');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Class = require('../models/Class');
const ClassSession = require('../models/ClassSession');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use environment variable or fallback to a default connection string
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym-crm';
    
    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected for verification: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Verification function
const verifyMultiTenant = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    console.log('Starting multi-tenant verification...');
    
    // Check if default gym exists
    const gyms = await Gym.find();
    console.log(`Found ${gyms.length} gyms in the system`);
    
    if (gyms.length === 0) {
      console.log('No gyms found. Migration may not have run successfully.');
      return;
    }
    
    // Display gym details
    gyms.forEach((gym, index) => {
      console.log(`Gym ${index + 1}: ${gym.name} (ID: ${gym._id})`);
    });
    
    // Count entities with gym association
    const defaultGym = gyms[0];
    
    // Users
    const totalUsers = await User.countDocuments();
    const usersWithGym = await User.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Users: ${usersWithGym}/${totalUsers} have gym association`);
    
    // Members
    const totalMembers = await Member.countDocuments();
    const membersWithGym = await Member.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Members: ${membersWithGym}/${totalMembers} have gym association`);
    
    // Memberships
    const totalMemberships = await Membership.countDocuments();
    const membershipsWithGym = await Membership.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Memberships: ${membershipsWithGym}/${totalMemberships} have gym association`);
    
    // Payments
    const totalPayments = await Payment.countDocuments();
    const paymentsWithGym = await Payment.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Payments: ${paymentsWithGym}/${totalPayments} have gym association`);
    
    // Classes
    const totalClasses = await Class.countDocuments();
    const classesWithGym = await Class.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Classes: ${classesWithGym}/${totalClasses} have gym association`);
    
    // Class Sessions
    const totalSessions = await ClassSession.countDocuments();
    const sessionsWithGym = await ClassSession.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Class Sessions: ${sessionsWithGym}/${totalSessions} have gym association`);
    
    // Staff
    const totalStaff = await Staff.countDocuments();
    const staffWithGym = await Staff.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Staff: ${staffWithGym}/${totalStaff} have gym association`);
    
    // Attendance
    const totalAttendance = await Attendance.countDocuments();
    const attendanceWithGym = await Attendance.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Attendance: ${attendanceWithGym}/${totalAttendance} have gym association`);
    
    // Settings
    const totalSettings = await Setting.countDocuments();
    const settingsWithGym = await Setting.countDocuments({ gym: { $exists: true, $ne: null } });
    console.log(`Settings: ${settingsWithGym}/${totalSettings} have gym association`);
    
    // Check for superadmin users
    const superadmins = await User.find({ role: 'superadmin' });
    console.log(`Found ${superadmins.length} superadmin users`);
    
    if (superadmins.length > 0) {
      console.log('Superadmin details:');
      superadmins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.name} (${admin.email})`);
      });
    }
    
    console.log('\nVerification complete!');
    
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
  }
};

// Add debug logging to help identify issues
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
});

// Run the verification with explicit console output
console.log('Starting verification script...');
verifyMultiTenant()
  .then(() => {
    console.log('Verification process completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Verification failed with error:', err);
    process.exit(1);
  });
