/*
  003_fix_all_rls_policies.sql
  =============================
  A consolidated migration to fix all remaining RLS issues and repair 
  foreign key constraints across the Mentoga platform.
*/

-- ============================================================
-- 1. HELPERS
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid AS $$
  SELECT id FROM user_profiles WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 2. TABLE REPAIRS (FOREIGN KEYS)
-- ============================================================

-- Repaire all tables to reference user_profiles(id) instead of the old consultants(id)
-- This is necessary because we are identifying consultants via their profile ID.

-- Courses
ALTER TABLE courses 
DROP CONSTRAINT IF EXISTS courses_consultant_id_fkey,
ADD CONSTRAINT courses_consultant_id_fkey 
FOREIGN KEY (consultant_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Availability Slots
ALTER TABLE availability_slots
DROP CONSTRAINT IF EXISTS availability_slots_consultant_id_fkey,
ADD CONSTRAINT availability_slots_consultant_id_fkey
FOREIGN KEY (consultant_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE availability_slots ADD COLUMN IF NOT EXISTS specific_date DATE NULL;

-- Bookings
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_consultant_id_fkey,
ADD CONSTRAINT bookings_consultant_id_fkey
FOREIGN KEY (consultant_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Payments
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_consultant_id_fkey,
ADD CONSTRAINT payments_consultant_id_fkey
FOREIGN KEY (consultant_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Reviews
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_consultant_id_fkey,
ADD CONSTRAINT reviews_consultant_id_fkey
FOREIGN KEY (consultant_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 3. RLS POLICIES (FULL RESET)
-- ============================================================

-- USER_PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON user_profiles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin can update all profiles" ON user_profiles FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin can delete profiles" ON user_profiles FOR DELETE TO authenticated USING (is_admin());

-- CONSULTANTS
DROP POLICY IF EXISTS "Anyone can view active consultants" ON consultants;
DROP POLICY IF EXISTS "Consultants can view own profile" ON consultants;
DROP POLICY IF EXISTS "Consultants can update own data" ON consultants;
DROP POLICY IF EXISTS "Users can create consultant profile" ON consultants;
DROP POLICY IF EXISTS "Admin can view all consultants" ON consultants;

CREATE POLICY "Anyone can view active consultants" ON consultants FOR SELECT USING (is_active = true);
CREATE POLICY "Consultants can view own profile" ON consultants FOR SELECT TO authenticated USING (user_id = get_my_profile_id());
CREATE POLICY "Consultants can update own data" ON consultants FOR UPDATE TO authenticated USING (user_id = get_my_profile_id()) WITH CHECK (user_id = get_my_profile_id());
CREATE POLICY "Users can create consultant profile" ON consultants FOR INSERT TO authenticated WITH CHECK (user_id = get_my_profile_id());
CREATE POLICY "Admin can view all consultants" ON consultants FOR SELECT TO authenticated USING (is_admin());

-- BOOKINGS
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Consultants can update booking status" ON bookings;
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT TO authenticated USING (user_id = get_my_profile_id() OR consultant_id = get_my_profile_id());
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT TO authenticated WITH CHECK (user_id = get_my_profile_id());
CREATE POLICY "Consultants can update booking status" ON bookings FOR UPDATE TO authenticated USING (consultant_id = get_my_profile_id()) WITH CHECK (consultant_id = get_my_profile_id());
CREATE POLICY "Admin can view all bookings" ON bookings FOR SELECT TO authenticated USING (is_admin());

-- COURSES
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Consultants can manage own courses" ON courses;
DROP POLICY IF EXISTS "Admin can view all courses" ON courses;

CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Consultants can manage own courses" ON courses FOR ALL TO authenticated USING (consultant_id = get_my_profile_id()) WITH CHECK (consultant_id = get_my_profile_id());
CREATE POLICY "Admin can view all courses" ON courses FOR SELECT TO authenticated USING (is_admin());

-- AVAILABILITY SLOTS
DROP POLICY IF EXISTS "Anyone can view availability" ON availability_slots;
DROP POLICY IF EXISTS "Consultants can manage own availability" ON availability_slots;

CREATE POLICY "Anyone can view availability" ON availability_slots FOR SELECT USING (is_available = true);
CREATE POLICY "Consultants can manage own availability" ON availability_slots FOR ALL TO authenticated USING (consultant_id = get_my_profile_id()) WITH CHECK (consultant_id = get_my_profile_id());

-- MESSAGES
DROP POLICY IF EXISTS "Booking participants can view messages" ON messages;
DROP POLICY IF EXISTS "Booking participants can send messages" ON messages;

CREATE POLICY "Booking participants can view messages" ON messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = messages.booking_id AND (bookings.user_id = get_my_profile_id() OR bookings.consultant_id = get_my_profile_id())));
CREATE POLICY "Booking participants can send messages" ON messages FOR INSERT TO authenticated 
  WITH CHECK (sender_id = get_my_profile_id() AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = messages.booking_id AND (bookings.user_id = get_my_profile_id() OR bookings.consultant_id = get_my_profile_id())));

-- PAYMENTS
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admin can view all payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments FOR SELECT TO authenticated USING (user_id = get_my_profile_id() OR consultant_id = get_my_profile_id());
CREATE POLICY "Admin can view all payments" ON payments FOR SELECT TO authenticated USING (is_admin());

-- Final Cleanup: Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
