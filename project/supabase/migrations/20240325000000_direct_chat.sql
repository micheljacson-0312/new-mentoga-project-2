-- Direct Chat and Multimedia Support

-- 1. Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consultant_id, client_id)
);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR consultant_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid() OR consultant_id = auth.uid());

-- 2. Update Messages Table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT false;

-- Allow messages to be optional for bookings (if they belong to a conversation)
ALTER TABLE messages ALTER COLUMN booking_id DROP NOT NULL;

-- Update RLS for messages to include conversation participation
DROP POLICY IF EXISTS "Booking participants can view messages" ON messages;
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.client_id = auth.uid() OR conversations.consultant_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = messages.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Booking participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND (conversations.client_id = auth.uid() OR conversations.consultant_id = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_id
        AND (bookings.user_id = auth.uid() OR bookings.consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid()))
      )
    )
  );

-- Function to handle unbilled chat tracking (Simplified trigger for now)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_timestamp();

-- 3. Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage (if supported in this environment)
-- Note: Often storage policies are managed in the Supabase UI, but we'll add them here as a reference.
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'chat-attachments');
