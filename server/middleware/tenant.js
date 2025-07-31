const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Middleware to set tenant context based on authenticated user
 * This middleware should be used after the auth middleware
 */
module.exports = async function(req, res, next) {
  try {
    // Skip tenant check for superadmin users
    if (req.user && req.user.role === 'superadmin') {
      // Superadmins can access all data, so we don't set a gym filter
      return next();
    }

    // For all other users, get their gym ID from the JWT token if available
    if (req.user && req.user.gym) {
      // Use the gym ID from the token
      req.gymId = req.user.gym;
      return next();
    }
    // Fallback to database lookup if token doesn't have gym ID (for backward compatibility)
    else if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).select('gym role');
      
      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }
      
      if (!user.gym && user.role !== 'superadmin') {
        return res.status(403).json({ msg: 'User not associated with any gym' });
      }
      
      // Set the gym ID in the request object for use in route handlers
      req.gymId = user.gym;
      return next();
    }
    
    return res.status(401).json({ msg: 'Not authorized to access this resource' });
  } catch (err) {
    console.error('Tenant middleware error:', err.message);
    return res.status(500).json({ msg: 'Server error in tenant middleware' });
  }
};
