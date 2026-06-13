-- Strengthen direct chat realtime delivery and conversation message access.

ALTER TABLE messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
DROP POLICY IF EXISTS "Booking participants can view messages" ON messages;
DROP POLICY IF EXISTS "Booking participants can send messages" ON messages;

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT TO authenticated
  USING (
    sender_id = get_my_profile_id()
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.client_id = get_my_profile_id()
        OR conversations.consultant_id = get_my_profile_id()
      )
    )
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = messages.booking_id
      AND (
        bookings.user_id = get_my_profile_id()
        OR bookings.consultant_id = get_my_profile_id()
      )
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = get_my_profile_id()
    AND (
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (
          conversations.client_id = get_my_profile_id()
          OR conversations.consultant_id = get_my_profile_id()
        )
      )
      OR EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = messages.booking_id
        AND (
          bookings.user_id = get_my_profile_id()
          OR bookings.consultant_id = get_my_profile_id()
        )
      )
    )
  );
