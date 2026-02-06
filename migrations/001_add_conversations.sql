-- Migration: Add conversations table
-- Run this in Supabase SQL Editor if upgrading from the previous schema

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  assigned_to UUID REFERENCES users(id),
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add conversation_id to communications
ALTER TABLE communications 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Add conversation_id to notes
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_communications_conversation ON communications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notes_conversation ON notes(conversation_id);

-- Optional: Create conversations for existing contacts (one per contact)
-- This migrates existing data into the new structure
INSERT INTO conversations (contact_id, status, last_message_at)
SELECT DISTINCT 
  c.contact_id, 
  'open', 
  COALESCE(MAX(c.created_at), NOW())
FROM communications c
WHERE c.conversation_id IS NULL
GROUP BY c.contact_id;

-- Link existing communications to their conversations
UPDATE communications 
SET conversation_id = conv.id
FROM conversations conv
WHERE communications.contact_id = conv.contact_id
  AND communications.conversation_id IS NULL;

-- Link existing notes to their conversations  
UPDATE notes 
SET conversation_id = conv.id
FROM conversations conv
WHERE notes.contact_id = conv.contact_id
  AND notes.conversation_id IS NULL;
