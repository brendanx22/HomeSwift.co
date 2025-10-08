import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import propertyRoutes from './routes/propertyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import { supabase } from './lib/supabaseClient.js';

dotenv.config();
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:5173'], credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.send('🏠 HomeSwift API running'));

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/email', emailRoutes);
app.use(queueRoutes); // Add queue dashboard routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// Function to check Supabase connection
const checkSupabaseConnection = async () => {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // First, check if we can connect to the database
    const { data: tables, error } = await supabase
      .rpc('get_tables');
      
    if (error) {
      // If the function doesn't exist, try a direct query to information_schema
      const { data: schemaData } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (schemaData) {
        console.log('✅ Supabase connected successfully!');
        console.log('   - URL:', process.env.SUPABASE_URL);
        console.log('   - Available tables:', schemaData.map(t => t.tablename).join(', ') || 'No tables found');
      }
    } else if (tables) {
      console.log('✅ Supabase connected successfully!');
      console.log('   - URL:', process.env.SUPABASE_URL);
      console.log('   - Available tables:', tables.join(', ') || 'No tables found');
    }
    
    // Test if we can perform a raw query
    const { data: versionData } = await supabase.rpc('version');
    if (versionData) {
      console.log('   - Database version:', versionData);
    }
    
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    console.log('   - This might be normal if you haven\'t set up your database tables yet.');
    console.log('   - The connection to Supabase is working, but the database might be empty.');
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
  
  // Check Supabase connection
  await checkSupabaseConnection();
  
  console.log('\n🔍 Environment Variables Check:');
  console.log('   - NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
});
