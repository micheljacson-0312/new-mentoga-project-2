-- Allow direct chat billing and message settlement.

DROP POLICY IF EXISTS "Users can create own payments" ON payments;
CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (user_id = get_my_profile_id());

DROP POLICY IF EXISTS "Conversation participants can update billed messages" ON messages;
CREATE POLICY "Conversation participants can update billed messages"
  ON messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.client_id = get_my_profile_id() OR
        conversations.consultant_id = get_my_profile_id()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.client_id = get_my_profile_id() OR
        conversations.consultant_id = get_my_profile_id()
      )
    )
  );
