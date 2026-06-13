-- Fix RLS for Conversations and Messages
-- The previous policies were comparing user_profiles.id directly with auth.uid()

-- 1. Redefine Conversations Policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR 
    consultant_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR 
    consultant_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
  );

-- 2. Redefine Messages Policies
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.client_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR 
        conversations.consultant_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
      )
    ) OR
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = messages.booking_id
      AND (
        bookings.user_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR 
        bookings.consultant_id IN (SELECT id FROM consultants WHERE user_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND (
          conversations.client_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR 
          conversations.consultant_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        )
      ) OR
      EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_id
        AND (
          bookings.user_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR 
          bookings.consultant_id IN (SELECT id FROM consultants WHERE user_id IN (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
        )
      )
    )
  );
