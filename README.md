# HomeSwift - Property Management Platform

A modern property management platform built with React, Vite, Tailwind CSS, and Supabase. HomeSwift connects property owners with potential renters through an intuitive interface.

## Features

- **User Authentication**
  - Renter and landlord signup/login
  - Email/password and social authentication
  - Protected routes based on user type

- **Property Management**
  - List and manage properties (landlords)
  - Browse and filter properties (renters)
  - Property details and image galleries

- **Responsive Design**
  - Mobile-first approach
  - Clean, modern UI with Tailwind CSS
  - Accessible components

## Tech Stack

- **Frontend**: React 18, Vite, React Router 6
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel (frontend), Supabase (backend)

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
   - Create a `.env` file in the root directory
   - Copy the contents from `.env.example` and update with your Supabase credentials
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase**
   - Create a new project in Supabase
   - Set up the following tables:
     ```sql
     -- Create a table for properties
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

     -- Set up Row Level Security (RLS) policies
     alter table properties enable row level security;

     -- Allow public read access
     create policy "Public properties are viewable by everyone." 
     on properties for select using (true);

     -- Allow authenticated users to insert their own properties
     create policy "Users can insert their own properties." 
     on properties for insert with check (auth.uid() = landlord_id);

     -- Allow users to update their own properties
     create policy "Users can update their own properties." 
     on properties for update using (auth.uid() = landlord_id);
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

### Backend (Supabase)

The backend is already set up with Supabase. Just make sure to update the CORS settings in your Supabase dashboard to include your frontend domain.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
