-- Admin-manageable non-secret payment provider settings.

CREATE TABLE IF NOT EXISTS payment_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_test_mode BOOLEAN NOT NULL DEFAULT true,
  publishable_key TEXT,
  webhook_endpoint TEXT,
  webhook_last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_provider_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view payment provider settings" ON payment_provider_settings;
DROP POLICY IF EXISTS "Admin can insert payment provider settings" ON payment_provider_settings;
DROP POLICY IF EXISTS "Admin can update payment provider settings" ON payment_provider_settings;

CREATE POLICY "Admin can view payment provider settings"
ON payment_provider_settings FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admin can insert payment provider settings"
ON payment_provider_settings FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update payment provider settings"
ON payment_provider_settings FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

INSERT INTO payment_provider_settings (provider, is_enabled, is_test_mode)
VALUES ('stripe', false, true)
ON CONFLICT (provider) DO NOTHING;
