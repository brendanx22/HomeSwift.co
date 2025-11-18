/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing for the API
 */

const allowedOrigins = [
  'https://www.homeswift.co',
  'https://homeswift.co',
  'http://localhost:3000',
  'http://localhost:5000'
];

const cors = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from our frontend domains
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Allow credentials (cookies, authorization headers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Allowed HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // Allowed headers
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token'
  );
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

module.exports = cors;
