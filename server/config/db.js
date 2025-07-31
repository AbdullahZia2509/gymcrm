const mongoose = require('mongoose');

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

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
