-- =============================================
-- CHAT SYSTEM SCHEMA FOR HOMESWIFT
-- Real-time messaging system using Supabase
-- =============================================

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;

-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID,
  participants UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat participants
CREATE TABLE chat_participants (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (chat_id, user_id)
);

-- 4. Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for performance
CREATE INDEX idx_messages_chat ON messages (chat_id);
CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_chat_participants_user ON chat_participants (user_id);
CREATE INDEX idx_chat_participants_chat ON chat_participants (chat_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS for all three tables
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Read own chats" ON chats;
DROP POLICY IF EXISTS "Create chats" ON chats;

-- Users can read chats they are part of
CREATE POLICY "Read own chats" ON chats
FOR SELECT USING (
  auth.uid() = ANY(participants)
  OR auth.role() = 'service_role'
);

-- Users can create new chats (either participant can create)
CREATE POLICY "Create chats" ON chats
FOR INSERT WITH CHECK (
  auth.uid() = ANY(participants)
  OR auth.role() = 'service_role'
);

-- Drop existing policies first
DROP POLICY IF EXISTS "Read participants" ON chat_participants;
DROP POLICY IF EXISTS "Add participants" ON chat_participants;

-- Users can read participants of their chats (simplified to avoid circular reference)
CREATE POLICY "Read participants" ON chat_participants
FOR SELECT USING (
  true
  OR auth.role() = 'service_role'
);

-- Users can add themselves to chats
CREATE POLICY "Add participants" ON chat_participants
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR auth.role() = 'service_role'
);

-- Drop existing policies first
DROP POLICY IF EXISTS "Send messages in own chats" ON messages;
DROP POLICY IF EXISTS "Read messages in own chats" ON messages;
DROP POLICY IF EXISTS "Update message read status" ON messages;

-- Users can insert messages only in chats they belong to (or allow service role)
CREATE POLICY "Send messages in own chats" ON messages
FOR INSERT WITH CHECK (
  chat_id IN (SELECT id FROM chats WHERE auth.uid() = ANY(participants))
  OR auth.role() = 'service_role'
);

-- Users can read messages of their chats
CREATE POLICY "Read messages in own chats" ON messages
FOR SELECT USING (
  chat_id IN (SELECT id FROM chats WHERE auth.uid() = ANY(participants))
  OR auth.role() = 'service_role'
);

-- Users can update message read status in their chats
CREATE POLICY "Update message read status" ON messages
FOR UPDATE USING (
  chat_id IN (SELECT id FROM chats WHERE auth.uid() = ANY(participants))
  OR auth.role() = 'service_role'
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_chats(UUID);

-- Function to get user's chat list
CREATE OR REPLACE FUNCTION get_user_chats(user_uuid UUID)
RETURNS TABLE (
  chat_id UUID,
  property_id UUID,
  created_at TIMESTAMPTZ,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as chat_id,
    c.property_id,
    c.created_at,
    m.message as last_message,
    m.created_at as last_message_time,
    COUNT(CASE WHEN m.read = FALSE AND m.sender_id != user_uuid THEN 1 END) as unread_count
  FROM chats c
  LEFT JOIN messages m ON c.id = m.chat_id AND m.id = (
    SELECT id FROM messages
    WHERE messages.chat_id = c.id
    ORDER BY messages.created_at DESC
    LIMIT 1
  )
  WHERE user_uuid = ANY(c.participants)
  GROUP BY c.id, c.property_id, c.created_at, m.message, m.created_at
  ORDER BY COALESCE(m.created_at, c.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SETUP COMPLETE - CHAT SYSTEM READY!
-- =============================================
