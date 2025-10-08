-- Create SMTP settings table
CREATE TABLE IF NOT EXISTS public.smtp_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  secure BOOLEAN NOT NULL DEFAULT false,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  message_id TEXT,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_links JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to admins only
CREATE POLICY "Enable read access for admins" 
ON public.email_logs
FOR SELECT
TO authenticated
USING (auth.role() = 'service_role');

-- Create policy to allow insert access to service role
CREATE POLICY "Enable insert for service role"
ON public.email_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- Insert default SMTP settings (update with your actual SMTP details)
-- This should be done through your admin interface in production
-- INSERT INTO public.smtp_settings (host, port, secure, username, password, from_email, from_name)
-- VALUES ('smtp.example.com', 587, false, 'your_username', 'your_password', 'noreply@yourdomain.com', 'HomeSwift')
-- ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for smtp_settings
CREATE TRIGGER update_smtp_settings_modtime
BEFORE UPDATE ON public.smtp_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
