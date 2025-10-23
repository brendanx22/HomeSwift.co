# HomeSwift - Property Management Platform

A modern property management platform built with React, Vite, Tailwind CSS, and Supabase. HomeSwift connects property owners with potential renters through an intuitive interface.

## Features

- **User Authentication**

  - Renter and landlord signup/login
  - Email/password and social authentication
  - Protected routes based on user type

- **Real-Time Messaging**

  - WebRTC-powered direct communication between landlords and renters
  - Socket.IO for instant message delivery and presence
  - Video calling and audio communication
  - Message history and conversation management
  - Typing indicators and read receipts

- **Advanced Analytics**

  - Property performance tracking
  - Inquiry analytics and conversion rates
  - Market trends and insights
  - Revenue tracking for landlords

- **Responsive Design**
  - Mobile-first approach
  - Clean, modern UI with Tailwind CSS
  - Accessible components

## Tech Stack

- **Frontend**: React 18, Vite, React Router 6
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Real-Time Communication**: Socket.IO, WebRTC
- **State Management**: React Context API
- **Deployment**: Vercel (frontend), Custom backend (API)

## Prerequisites

- Node.js 16+ and npm 8+
- Supabase account (https://supabase.com/)
- Git

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/homeswift-starter-fixed.git
   cd homeswift-starter-fixed
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   The project includes two environment configurations:

   **For Production (default)**:
   - The `.env` file is configured for production with HTTPS URLs
   - Uses `https://api.homeswift.co` for backend API calls

   **For Development (localhost)**:
   - Copy `.env.development` to `.env` for local development
   - Uses `http://localhost:5000` for backend API calls
   - Make sure your backend server is running locally

   **Required Environment Variables**:

   ```env
   # Frontend (Vite) - used by client
   VITE_BACKEND_URL=https://api.homeswift.co  # Production backend URL
   VITE_API_URL=https://api.homeswift.co      # API URL for messaging
   VITE_SUPABASE_URL=your-supabase-url        # Your Supabase project URL
   VITE_SUPABASE_ANON_KEY=your-supabase-key   # Your Supabase anon key

   # Backend Configuration
   PORT=5000
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase**

   - Create a new project in Supabase
   - Set up the following tables:

     ```sql
     -- Properties table (existing)
     create table properties (
       id uuid default uuid_generate_v4() primary key,
       title text not null,
       description text,
       price decimal(10, 2) not null,
       location text not null,
       bedrooms integer,
       bathrooms decimal(3, 1),
       area integer,
       landlord_id uuid references auth.users(id) not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       updated_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Enable RLS for properties
     alter table properties enable row level security;
     create policy "Public properties are viewable by everyone." on properties for select using (true);
     create policy "Users can insert their own properties." on properties for insert with check (auth.uid() = landlord_id);
     create policy "Users can update their own properties." on properties for update using (auth.uid() = landlord_id);

     -- Messaging tables (new)
     create table conversations (
       id uuid default uuid_generate_v4() primary key,
       sender_id uuid references auth.users(id) not null,
       receiver_id uuid references auth.users(id) not null,
       participants uuid[] not null,
       last_message text,
       last_message_at timestamp with time zone,
       created_at timestamp with time zone default now(),
       updated_at timestamp with time zone default now()
     );

     create table messages (
       id uuid default uuid_generate_v4() primary key,
       conversation_id uuid references conversations(id) not null,
       sender_id uuid references auth.users(id) not null,
       receiver_id uuid references auth.users(id) not null,
       content text not null,
       message_type text default 'text',
       is_read boolean default false,
       created_at timestamp with time zone default now(),
       updated_at timestamp with time zone default now()
     );

     -- Enable RLS for messaging tables
     alter table conversations enable row level security;
     alter table messages enable row level security;

     -- Messaging RLS policies
     create policy "Users can view conversations they participate in" on conversations for select using (auth.uid() = any(participants));
     create policy "Users can create conversations" on conversations for insert with check (auth.uid() = sender_id);
     create policy "Users can view messages in their conversations" on messages for select using (auth.uid() in (select unnest(participants) from conversations where id = conversation_id));
     create policy "Users can send messages in their conversations" on messages for insert with check (auth.uid() = sender_id);
     ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**
   The application should be running at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/        # React contexts (auth, theme, etc.)
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   ├── landlord/    # Landlord-specific pages
│   └── renter/      # Renter-specific pages
├── services/        # API and service functions
├── styles/          # Global styles and Tailwind config
└── utils/           # Utility functions and constants
```

## Deployment

### Frontend (Vercel)

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the repository to Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy!

### Backend (Custom Server)

The backend runs on a custom Node.js server with Socket.IO for real-time messaging:

1. Deploy to a VPS or cloud service (DigitalOcean, AWS, Heroku, etc.)
2. Set up environment variables for production
3. Install PM2 for process management: `npm install -g pm2`
4. Start the server: `pm2 start backend/index.js --name "homeswift-backend"`
5. Set up reverse proxy (nginx) for production

### Database (Supabase)

The database is hosted on Supabase for easy scaling and real-time features.

1. Set up your Supabase project
2. Run the database migrations
3. Configure Row Level Security policies
4. Update environment variables with production URLs

## Environment Variables

The project supports both development and production environments:

### Production Environment (.env)
```env
# Frontend (Vite) - used by client
VITE_BACKEND_URL=https://api.homeswift.co
VITE_API_URL=https://api.homeswift.co
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_URL=https://homeswift.co
```

### Development Environment (.env.development)
```env
# Frontend (Vite) - used by client
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_URL=http://localhost:3000
```

### Backend Environment Variables
```env
PORT=5000
NODE_ENV=production|development
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-jwt-secret
```

**Important**: Never commit sensitive environment variables to version control. Use `.env.local` for local overrides.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## WebRTC Messaging System

HomeSwift includes a complete real-time messaging system with WebRTC support for direct peer-to-peer communication between landlords and renters.

### ✨ Key Features

- **Real-Time Messaging**: Socket.IO-powered instant message delivery
- **WebRTC Communication**: Direct peer-to-peer connections for enhanced performance
- **Video Calling**: High-quality video conferencing between users
- **Typing Indicators**: See when others are typing in real-time
- **Online Status**: Real-time user presence and availability
- **Message History**: Persistent chat history with search capabilities
- **Mobile Responsive**: Optimized messaging interface for all devices

### 🔧 Technical Implementation

- **Backend**: Express.js with Socket.IO for real-time communication
- **Frontend**: React Context API for state management
- **Database**: PostgreSQL with Row Level Security
- **WebRTC**: Peer connection management with STUN/TURN servers
- **Security**: JWT authentication and encrypted communications

### 📱 User Experience

- **Unified Interface**: Seamless messaging across all platform views
- **Quick Access**: Messages available from navigation in both dashboards
- **Smart Matching**: Automatic conversation creation between interested parties
- **Rich Media**: Support for text, images, and file sharing (planned)
- **Call Integration**: Easy transition from messaging to video calls

### 🚀 Getting Started with Messaging

1. **Access Messages**: Click the Messages tab in your dashboard
2. **Start Conversations**: Search for online users or continue existing chats
3. **Real-Time Chat**: Send and receive messages instantly
4. **Video Calls**: Click the video icon to start a video call
5. **Stay Connected**: Receive notifications for new messages and calls

---

**🎉 The complete WebRTC messaging system is now fully integrated into HomeSwift!**
