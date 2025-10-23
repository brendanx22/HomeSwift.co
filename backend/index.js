require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require("@supabase/supabase-js");
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

// Enhanced logging setup
const log = (message, data = "") => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || "");
};

const errorLog = (message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error?.message || error);
  if (error?.stack) {
    console.error(error.stack);
  }
};

// Store active WebRTC connections and online users
const onlineUsers = new Map();
const activeConnections = new Map();

const app = express();
const PORT = process.env.PORT || 5000;

log(`Starting server on port ${PORT}...`);
log(`Node environment: ${process.env.NODE_ENV || "development"}`);

// Enable CORS with specific options
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173", // Vite default port
    "https://homeswift.co", // Production frontend
    "https://www.homeswift.co", // With www
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Total-Count"],
};

log("CORS configuration:", JSON.stringify(corsOptions, null, 2));
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));
log("CORS preflight handling enabled");

// Enhanced request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
  });

  next();
});

// Regular middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

log("Express middleware initialized");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseJWTSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseKey) {
  errorLog("FATAL: Missing Supabase configuration");
  console.error("SUPABASE_URL:", supabaseUrl ? "Set" : "Missing");
  console.error("SUPABASE_ANON_KEY:", supabaseKey ? "Set" : "Missing");
  process.exit(1);
}

try {
  log("Initializing Supabase client...");
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "supabase.auth.token",
    },
  });

  // Test the Supabase connection
  (async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      log("Supabase client initialized successfully");
      log("Supabase session:", data?.session ? "Active" : "No active session");
    } catch (error) {
      errorLog("Supabase connection test failed", error);
    }
  })();

  // Create HTTP server and Socket.IO
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://homeswift.co",
        "https://www.homeswift.co"
      ],
      credentials: true
    }
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Use Supabase client to verify the token
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        errorLog('Socket authentication failed:', error);
        return next(new Error('Authentication error: Invalid token'));
      }

      // Get user profile data including user_type
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        errorLog('Error fetching user profile for socket:', profileError);
      }

      // Create user profile if it doesn't exist
      let userProfile = profile;
      if (profileError && profileError.code === 'PGRST116') {
        log('Creating new user profile for socket user:', user.id);
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
          errorLog('Error creating user profile for socket:', createError);
        } else {
          userProfile = newProfile;
          log('User profile created successfully for socket');
        }
      }

      // Attach user data to socket
      socket.userId = user.id;
      socket.user = {
        id: user.id,
        email: user.email,
        user_type: userProfile?.user_type || user.user_metadata?.user_type || 'renter',
        ...user,
        ...userProfile
      };

      log(`Socket authenticated for user: ${socket.userId}`);
      next();
    } catch (error) {
      errorLog('Socket authentication failed:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Make supabase client and io available in all routes
  app.use((req, res, next) => {
    req.supabase = supabase;
    req.io = io;
    req.log = log;
    req.errorLog = errorLog;
    next();
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    log(`User connected: ${socket.id} (User ID: ${socket.userId})`);

    // Handle user joining their room (based on user ID)
    socket.on('join', (userId) => {
      socket.join(userId);
      log(`User ${userId} joined their room`);

      // Add user to online users
      socket.on('user_online', (userData) => {
        onlineUsers.set(userId, {
          ...userData,
          socketId: socket.id,
          lastSeen: new Date()
        });
        log(`User ${userId} went online:`, userData);

        // Broadcast to all other users that this user is online
        socket.broadcast.emit('user_online', { userId, userData });
      });

      // Handle WebRTC signaling
      socket.on('webrtc_offer', (data) => {
        log(`WebRTC offer from ${userId} to ${data.targetUserId} (${data.callType || 'video'})`);
        socket.to(data.targetUserId).emit('webrtc_offer', {
          from: userId,
          offer: data.offer,
          callType: data.callType || 'video'
        });
      });

      socket.on('webrtc_answer', (data) => {
        log(`WebRTC answer from ${userId} to ${data.targetUserId} (${data.callType || 'video'})`);
        socket.to(data.targetUserId).emit('webrtc_answer', {
          from: userId,
          answer: data.answer,
          callType: data.callType || 'video'
        });
      });

      socket.on('webrtc_ice_candidate', (data) => {
        log(`WebRTC ICE candidate from ${userId} to ${data.targetUserId} (${data.callType || 'video'})`);
        socket.to(data.targetUserId).emit('webrtc_ice_candidate', {
          from: userId,
          candidate: data.candidate,
          callType: data.callType || 'video'
        });
      });

      // Handle call initiation (notify target user)
      socket.on('initiate_call', (data) => {
        const { targetUserId, callType } = data;
        log(`Call initiation from ${userId} to ${targetUserId} (${callType})`);

        // Notify target user about incoming call
        socket.to(targetUserId).emit('incoming_call', {
          from: userId,
          callType,
          callerData: socket.user
        });

        // Confirm to caller that notification was sent
        socket.emit('call_initiated', {
          targetUserId,
          callType
        });
      });

      // Handle call response (accept/reject)
      socket.on('call_response', (data) => {
        const { targetUserId, accepted, callType } = data;
        log(`Call response from ${userId} to ${targetUserId}: ${accepted ? 'accepted' : 'rejected'}`);

        socket.to(targetUserId).emit('call_response', {
          from: userId,
          accepted,
          callType
        });
      });

      // Handle real-time messaging via WebRTC data channels
      // This is for peer-to-peer messaging, not regular HTTP API messages
      socket.on('send_message', async (data) => {
        try {
          const { conversationId, content, receiverId } = data;
          const userId = socket.userId;

          // Save message to database (for WebRTC messages)
          const { data: message, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: userId,
              content,
              message_type: 'text',
              is_read: false
            })
            .select()
            .single();

          if (error) {
            errorLog('Error saving WebRTC message:', error);
            return;
          }

          // Update conversation last message
          await supabase
            .from('conversations')
            .update({
              last_message: content,
              last_message_at: new Date().toISOString()
            })
            .eq('id', conversationId);

          // Send message to receiver in real-time
          socket.to(receiverId).emit('new_message', {
            message,
            conversationId
          });

          // Send confirmation to sender
          socket.emit('message_sent', { message });

        } catch (error) {
          errorLog('Error in WebRTC send_message socket event:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(data.receiverId).emit('user_typing', {
          userId,
          conversationId: data.conversationId
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(data.receiverId).emit('user_stopped_typing', {
          userId,
          conversationId: data.conversationId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        log(`User ${userId} disconnected`);
        onlineUsers.delete(userId);

        // Broadcast to all other users that this user went offline
        socket.broadcast.emit('user_offline', { userId });
      });
    });

    // Handle disconnect without joining
    socket.on('disconnect', () => {
      log(`Socket disconnected: ${socket.id}`);
      // Remove from online users (if they were added)
      for (const [userId, userData] of onlineUsers.entries()) {
        if (userData.socketId === socket.id) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user_offline', { userId });
          break;
        }
      }
    });
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/properties", propertyRoutes);
  app.use("/api/messages", messageRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Start server with Socket.IO
  server.listen(PORT, () => {
    console.log(`Server with Socket.IO is running on port ${PORT}`);
    console.log(`WebRTC messaging is enabled`);
  });

  module.exports = { app, server, io };
} catch (error) {
  errorLog("Failed to initialize Supabase client", error);
  process.exit(1);
}
