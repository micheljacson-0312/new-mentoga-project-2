-- Function to check if an email exists in user_profiles
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE email = email_to_check
  );
END;
$$;

-- Grant access to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon, authenticated;
