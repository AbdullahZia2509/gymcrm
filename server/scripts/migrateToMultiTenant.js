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

    console.log(`MongoDB Connected for migration: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Migration function
const migrateToMultiTenant = async () => {
  let conn;
  try {
    // Connect to the database
    conn = await connectDB();
    console.log('Starting migration to multi-tenant structure...');
    
    // Create a default gym if none exists
    let defaultGym = await Gym.findOne({ name: 'Default Gym' });
    
    if (!defaultGym) {
      console.log('Creating default gym...');
      defaultGym = new Gym({
        name: 'Default Gym',
        description: 'Default gym created during migration to multi-tenant structure',
        contactEmail: 'admin@defaultgym.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await defaultGym.save();
      console.log(`Default gym created with ID: ${defaultGym._id}`);
    } else {
      console.log(`Using existing default gym with ID: ${defaultGym._id}`);
    }
    
    // Log the default gym details
    console.log('Default gym details:', {
      id: defaultGym._id,
      name: defaultGym.name,
      email: defaultGym.contactEmail
    });
    
    // Update all users to reference the default gym (except superadmins)
    console.log('Updating users...');
    const userUpdateResult = await User.updateMany(
      { gym: { $exists: false }, role: { $ne: 'superadmin' } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${userUpdateResult.modifiedCount || userUpdateResult.nModified || 0} users`);
    
    // Update all members
    console.log('Updating members...');
    const memberUpdateResult = await Member.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${memberUpdateResult.modifiedCount || memberUpdateResult.nModified || 0} members`);
    
    // Update all memberships
    console.log('Updating memberships...');
    const membershipUpdateResult = await Membership.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${membershipUpdateResult.modifiedCount || membershipUpdateResult.nModified || 0} memberships`);
    
    // Update all payments
    console.log('Updating payments...');
    const paymentUpdateResult = await Payment.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${paymentUpdateResult.modifiedCount || paymentUpdateResult.nModified || 0} payments`);
    
    // Update all classes
    console.log('Updating classes...');
    const classUpdateResult = await Class.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${classUpdateResult.modifiedCount || classUpdateResult.nModified || 0} classes`);
    
    // Update all class sessions
    console.log('Updating class sessions...');
    const sessionUpdateResult = await ClassSession.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${sessionUpdateResult.modifiedCount || sessionUpdateResult.nModified || 0} class sessions`);
    
    // Update all staff
    console.log('Updating staff...');
    const staffUpdateResult = await Staff.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${staffUpdateResult.modifiedCount || staffUpdateResult.nModified || 0} staff members`);
    
    // Update all attendance records
    console.log('Updating attendance records...');
    const attendanceUpdateResult = await Attendance.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${attendanceUpdateResult.modifiedCount || attendanceUpdateResult.nModified || 0} attendance records`);
    
    // Update all settings
    console.log('Updating settings...');
    const settingUpdateResult = await Setting.updateMany(
      { gym: { $exists: false } },
      { $set: { gym: defaultGym._id } }
    );
    console.log(`Updated ${settingUpdateResult.modifiedCount || settingUpdateResult.nModified || 0} settings`);
    
    console.log('Migration completed successfully!');
    
    // Create a superadmin user if none exists
    const superadminExists = await User.findOne({ role: 'superadmin' });
    
    if (!superadminExists) {
      console.log('No superadmin found. Creating a default superadmin user...');
      
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      const superadmin = new User({
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        role: 'superadmin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await superadmin.save();
      console.log('Default superadmin user created:');
      console.log('Email: superadmin@example.com');
      console.log('Password: superadmin123');
      console.log('IMPORTANT: Please change this password immediately after login!');
    }
    
    return true; // Migration successful
  } catch (err) {
    console.error('Migration error:', err);
    return false; // Migration failed
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
  }
};

// Run the migration and log results
migrateToMultiTenant()
  .then(() => console.log('Migration completed successfully!'))
  .catch(err => console.error('Migration failed:', err));
