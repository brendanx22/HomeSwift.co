const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const supabase = require("../utils/supabaseClient");
const supabaseAdmin = require("../utils/supabaseAdmin");

// =============================
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
// =============================
exports.signup = async (req, res) => {
  const { email, password, user_type, full_name } = req.body;
  console.log('Signup request received:', { body: req.body });

  let userId = null;

  try {
    // Input validation
    if (!email || !password || !user_type || !full_name) {
      console.error('Missing required fields:', {
        email: !!email,
        password: !!password,
        user_type: !!user_type,
        full_name: !!full_name,
      });
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    // Check if user already exists in profiles
    console.log(`Checking if user exists in user_profiles: ${email}`);
    const { data: existingUsers, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);

    if (profileCheckError) {
      console.error('Error checking existing profiles:', profileCheckError);
      throw new Error('Failed to check existing users');
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists in user_profiles');
      return res.status(400).json({ 
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Create user in Supabase Auth
    console.log('Creating user in Supabase Auth:', { email, full_name, user_type });
    
    try {
      const authResponse = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name, user_type },
      });

      if (authResponse.error) throw authResponse.error;
      
      userId = authResponse.data.user?.id;
      if (!userId) {
        throw new Error('No user ID returned from Supabase');
      }
      
      console.log('User created in auth, ID:', userId);
    } catch (error) {
      console.error('Error creating user in auth:', error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to create user: ${error.message}`
      });
    }

    // Create user profile in database
    console.log('Creating user profile in database...');
    
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        full_name,
        user_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    if (!newProfile || newProfile.length === 0) {
      console.error('No profile returned after insertion');
      throw new Error('Failed to create user profile - no data returned');
    }

    const profile = newProfile[0];
    console.log('Profile created successfully:', profile);
    return res.status(201).json({
      success: true,
      message: 'Signup successful',
      user: profile
    });

  } catch (error) {
    console.error('Error in signup process:', error);

    // Cleanup Supabase Auth if DB insertion fails
    if (userId) {
      try {
        console.log('Attempting to clean up auth user due to error...');
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteError) {
          console.error('Cleanup failed:', deleteError.message);
        } else {
          console.log('Successfully cleaned up auth user');
        }
      } catch (cleanupErr) {
        console.error('Error during cleanup:', cleanupErr);
      }
    }

    return res.status(500).json({
      success: false,
      error: `Failed to process signup: ${error.message}`
    });
  }
};

// =============================
// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
// =============================
exports.signin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  try {
    // First check if the user exists and their email is verified
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.listUsers({
        filter: `email='${email}'`,
      });

    if (userError || !userData.users.length) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = userData.users[0];

    // Check if email is verified
    if (!user.email_confirmed_at) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before signing in.",
        code: "email_not_verified",
        canResend: true,
      });
    }

    // Try to sign in with Supabase Auth
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    // If there's a sign-in error, handle it
    if (signInError) {
      console.error("Sign in error:", signInError);

      // Check for email not verified error
      if (
        signInError.message.includes("Email not confirmed") ||
        signInError.code === "email_not_confirmed"
      ) {
        // Generate a new verification link using admin client
        const { data: linkData, error: linkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email: email,
            options: {
              redirectTo: `${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/auth/callback`,
            },
          });

        if (linkError) {
          console.error("Error generating verification link:", linkError);
          return res.status(500).json({
            success: false,
            message: "Failed to generate verification link",
            code: "verification_error",
          });
        }

        // In production, you would send this link via email
        console.log("Verification link:", linkData?.properties?.action_link);
        // await sendVerificationEmail(email, linkData.properties.action_link);

        return res.status(403).json({
          success: false,
          message:
            "Please verify your email before signing in. A new verification link has been sent to your email.",
          code: "email_not_verified",
          email: email,
          ...(process.env.NODE_ENV !== "production" && {
            verification_link: linkData?.properties?.action_link,
          }),
        });
      }

      // Handle invalid credentials
      if (signInError.message.includes("Invalid login credentials")) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password. Please try again.",
          code: "invalid_credentials",
        });
      }

      // Handle rate limiting
      if (signInError.message.includes("Too many requests")) {
        return res.status(429).json({
          success: false,
          message: "Too many login attempts. Please try again later.",
          code: "too_many_requests",
        });
      }

      // Handle other authentication errors
      return res.status(401).json({
        success: false,
        message: signInError.message || "Login failed. Please try again.",
        code: signInError.code || "login_failed",
      });
    }

    // At this point, the user is authenticated and email is confirmed

    // Check if user profile exists, create if missing
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return res.status(500).json({
        success: false,
        message: "Error fetching user profile",
        code: "profile_error",
        error: profileError?.message,
      });
    }

    if (!userProfile || userProfile.length === 0) {
      console.error("No user profile found for user ID:", authData.user.id);
      return res.status(404).json({
        success: false,
        message: "User profile not found. Please complete your registration.",
        code: "profile_not_found",
      });
    }

    const profile = userProfile[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: authData.user.id,
        email: authData.user.email,
        user_type: profile.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data and token
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_type: profile.user_type,
        full_name: profile.full_name,
        email_confirmed: authData.user.email_confirmed_at !== null,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during sign in. Please try again.",
      code: "server_error",
    });
  }
};

// =============================
// @desc    Logout user
// @route   POST /api/auth/signout
// @access  Public
// =============================
exports.signout = async (req, res) => {
  try {
    // Clear the HTTP-only cookie if it exists
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      error: "Error during logout"
    });
  }
};

// =============================
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
// =============================

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        code: "missing_email",
      });
    }

    // Check if user exists and get user data
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching users:', userError);
      return res.status(500).json({
        success: false,
        error: "Error checking user account",
        code: "server_error",
      });
    }

    // Find user by email (client-side filtering since filter parameter isn't working)
    const user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No account found with this email",
        code: "user_not_found",
      });
    }

    // Check if email is already confirmed
    if (user.email_confirmed_at) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
        code: "already_verified",
      });
    }

    // Generate the redirect URL for after verification
    const redirectTo = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback`;

    // Use Supabase's built-in email verification resend
    const { data, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (resendError) {
      console.error("Error sending verification email:", resendError);
      throw resendError;
    }
    
    console.log("Resend response:", data);
    console.log("Verification email sent to:", email);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Verification email has been resent. Please check your inbox.',
      data: data
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    
    // Handle rate limiting
    if (error.message?.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: "Too many attempts. Please try again later.",
        code: "rate_limit_exceeded",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to resend verification email",
      code: error.code || "server_error",
    });
  }
};

// =========================
// @desc    Generate a new token for a user
// @route   POST /api/auth/token
// @access  Private
// =============================
exports.generateToken = async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Get user data from Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user profile to check user_type
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_id);

    if (profileError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile',
      });
    }

    if (!userProfile || userProfile.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    const profile = userProfile[0];

    // Generate JWT token with user_type
    const token = jwt.sign(
      {
        id: userData.user.id,
        email: userData.user.email,
        user_type: profile.user_type || 'renter',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        user_type: profile.user_type || 'renter',
        email_confirmed: userData.user.email_confirmed_at !== null,
      },
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate token',
    });
  }
};

// =========================
// @desc    Get current user session
// @route   GET /api/auth/session
// @access  Private
// =============================
exports.getSession = async (req, res) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(req.token);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id);

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return res.status(500).json({
        success: false,
        message: "Error fetching user profile",
        code: "profile_error",
        error: profileError?.message,
      });
    }

    let profile;
    if (!userProfile || userProfile.length === 0) {
      // Profile doesn't exist, create it
      console.log("No user profile found, creating one for user:", user.id);

      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          user_type: user.user_metadata?.user_type || 'renter',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (createError) {
        console.error("Error creating user profile:", createError);
        return res.status(500).json({
          success: false,
          message: "Error creating user profile",
          code: "profile_creation_error",
          error: createError?.message,
        });
      }

      profile = newProfile[0];
      console.log("Profile created successfully:", profile);
    } else {
      profile = userProfile[0];
      console.log("Profile found:", profile);
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        user_type: profile.user_type,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({
      success: false,
      error: "Error getting session",
    });
  }
};
