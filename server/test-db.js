import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  // Direct connection string
  const connectionString = `postgresql://postgres.tproaiqvkohrlxjmkgxt:${process.env.DB_PASSWORD}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require`;
  
  console.log('Connection string:', 
    connectionString.replace(/:([^:]*?)@/, ':***@')
  );
  
  const config = {
    connectionString,
    ssl: {
      rejectUnauthorized: false, // For development only
      // For additional debugging, you can add:
      // ca: fs.readFileSync('path/to/ca-certificate.crt').toString()
    }
  };
  
  // For debugging SSL issues
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const client = new pg.Client(config);

  try {
    await client.connect();
    console.log('✅ Successfully connected to the database');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('⏱️  Current database time:', result.rows[0].now);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check if your database URL is correct in .env');
    console.log('2. Verify your database password is correct');
    console.log('3. Ensure your IP is whitelisted in Supabase (if using IP restrictions)');
    console.log('4. Check if the database is running and accessible');
  } finally {
    await client.end();
    process.exit(0);
  }
}

testConnection();
