const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Import User model
const User = require("../models/User");

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use environment variable or fallback to a default connection string
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/gym-crm";

    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: "admin@gymcrm.com" });

    if (adminExists) {
      console.log("Admin user already exists");
      return;
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const adminUser = new User({
      name: "Admin User",
      email: "admin@gymcrm.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await adminUser.save();
    console.log("Admin user created successfully");
    console.log("Email: admin@gymcrm.com");
    console.log("Password: admin123");
    console.log("Please change this password after first login!");
  } catch (err) {
    console.error(`Error creating admin user: ${err.message}`);
  }
};

// Main function
const main = async () => {
  const connected = await connectDB();

  if (connected) {
    await createAdminUser();
    mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the script
main();
