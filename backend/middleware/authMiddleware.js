// Middleware to verify Supabase JWT token using Supabase client
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    // Use Supabase client to verify the token
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification failed:', error?.message);
      return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
    }

    // Get user profile data including user_type
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    // Create user profile if it doesn't exist
    let userProfile = profile;
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Creating new user profile for:', user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          user_type: user.user_metadata?.user_type || 'renter',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
      } else {
        userProfile = newProfile;
        console.log('User profile created successfully');
      }
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      user_type: userProfile?.user_type || user.user_metadata?.user_type || 'renter',
      ...user,
      ...userProfile
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
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
