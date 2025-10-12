import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUserByEmail(email) {
  try {
    // First find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('No user found with email:', email);
      return;
    }

    console.log('Found user:', user.id, user.email);
    
    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return;
    }
    
    console.log('Successfully deleted user:', email);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address as an argument');
  console.log('Usage: node scripts/cleanup-user.js user@example.com');
  process.exit(1);
}

deleteUserByEmail(email);
