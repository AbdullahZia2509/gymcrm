const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Use environment variable or fallback to a default secret
  const jwtSecret = process.env.JWT_SECRET || 'mysecretjwtkey';

  // Verify token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
