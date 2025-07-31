const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/members', require('./routes/members'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/gyms', require('./routes/gyms')); // New route for multi-tenancy gym management
app.use('/api/expenses', require('./routes/expenses')); // Expenses management route

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Define port
const PORT = process.env.PORT || 5001;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
