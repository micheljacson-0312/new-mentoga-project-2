-- Admin RLS Policies
-- Allow admin users to read/update/delete all data

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can view ALL user profiles
CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can update any user profile
CREATE POLICY "Admin can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can delete user profiles
CREATE POLICY "Admin can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin can view all consultants
CREATE POLICY "Admin can view all consultants"
  ON consultants FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can update any consultant
CREATE POLICY "Admin can update all consultants"
  ON consultants FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can view all bookings
CREATE POLICY "Admin can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all payments
CREATE POLICY "Admin can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can update payment status
CREATE POLICY "Admin can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can view all reviews
CREATE POLICY "Admin can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can delete reviews
CREATE POLICY "Admin can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin can view all messages
CREATE POLICY "Admin can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all courses
CREATE POLICY "Admin can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all enrollments
CREATE POLICY "Admin can view all enrollments"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can insert user profiles (for creating admin accounts)
CREATE POLICY "Admin can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
