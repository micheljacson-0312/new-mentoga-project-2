-- Fix reviews to use profile IDs instead of auth IDs.

DROP POLICY IF EXISTS "Users can create reviews for completed bookings" ON reviews;

CREATE POLICY "Users can create reviews for completed bookings"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    user_id = get_my_profile_id()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = get_my_profile_id()
      AND bookings.consultant_id = reviews.consultant_id
      AND bookings.status = 'completed'
    )
  );
