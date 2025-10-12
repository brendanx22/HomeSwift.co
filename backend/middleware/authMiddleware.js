const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
  }
};

// Middleware to check if user is a landlord
const isLandlord = (req, res, next) => {
  if (req.user?.user_type !== 'landlord') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Landlord privileges required.' 
    });
  }
  next();
};

// Middleware to check if user is a renter
const isRenter = (req, res, next) => {
  if (req.user?.user_type !== 'renter') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Renter privileges required.' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  isLandlord,
  isRenter
};
