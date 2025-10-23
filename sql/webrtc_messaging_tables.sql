-- ========================================
-- HomeSwift WebRTC Messaging Tables
-- Simplified version for maximum compatibility
-- ========================================

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participants TEXT NOT NULL DEFAULT '[]',
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table (without any constraints)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID,
    sender_id UUID,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE messages
ADD FOREIGN KEY (conversation_id) REFERENCES conversations(id);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "conversations_policy" ON conversations FOR ALL USING (true);
CREATE POLICY "messages_policy" ON messages FOR ALL USING (true);

-- Create conversation function
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    SELECT id INTO conversation_id
    FROM conversations
    WHERE participants LIKE '%' || user1_id::text || '%'
    AND participants LIKE '%' || user2_id::text || '%';

    IF conversation_id IS NULL THEN
        INSERT INTO conversations (participants)
        VALUES ('["' || user1_id::text || '","' || user2_id::text || '"]')
        RETURNING id INTO conversation_id;
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
