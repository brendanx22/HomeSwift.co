require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

// Enhanced logging setup
const log = (message, data = '') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

const errorLog = (message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error?.message || error);
  if (error?.stack) {
    console.error(error.stack);
  }
};

const app = express();
const PORT = process.env.PORT || 5000;

log(`Starting server on port ${PORT}...`);
log(`Node environment: ${process.env.NODE_ENV || 'development'}`);

// Enable CORS with specific options
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173' // Vite default port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
};

log('CORS configuration:', JSON.stringify(corsOptions, null, 2));
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
log('CORS preflight handling enabled');

// Enhanced request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
  });

  next();
});

// Regular middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

log('Express middleware initialized');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseJWTSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseKey) {
  errorLog('FATAL: Missing Supabase configuration');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

try {
  log('Initializing Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token'
    }
  });

  // Test the Supabase connection
  (async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      log('Supabase client initialized successfully');
      log('Supabase session:', data?.session ? 'Active' : 'No active session');
    } catch (error) {
      errorLog('Supabase connection test failed', error);
    }
  })();

  // Make supabase client available in all routes
  app.use((req, res, next) => {
    req.supabase = supabase;
    req.log = log;
    req.errorLog = errorLog;
    next();
  });
} catch (error) {
  errorLog('Failed to initialize Supabase client', error);
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
