-- Extend payment provider settings for multi-gateway support.

ALTER TABLE payment_provider_settings
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS public_key_label TEXT,
  ADD COLUMN IF NOT EXISTS integration_notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE payment_provider_settings
SET
  display_name = COALESCE(display_name, 'Stripe'),
  public_key_label = COALESCE(public_key_label, 'Publishable Key'),
  integration_notes = COALESCE(integration_notes, 'Store the Stripe secret key and webhook secret in Supabase secrets.'),
  metadata = COALESCE(metadata, '{}'::jsonb)
WHERE provider = 'stripe';

INSERT INTO payment_provider_settings (provider, display_name, is_enabled, is_test_mode, public_key_label, integration_notes, metadata)
VALUES
  ('easypaisa', 'Easypaisa', false, true, 'Store ID / Merchant Account', 'Store Easypaisa secret credentials in Supabase secrets and generate signed redirects server-side.', '{"secretNames": ["EASYPAISA_STORE_ID", "EASYPAISA_HASH_KEY"]}'::jsonb),
  ('jazzcash', 'JazzCash', false, true, 'Merchant ID / Integeration ID', 'Store JazzCash password, integrity salt, and merchant details in Supabase secrets.', '{"secretNames": ["JAZZCASH_MERCHANT_ID", "JAZZCASH_PASSWORD", "JAZZCASH_INTEGRITY_SALT"]}'::jsonb),
  ('payfast', 'PayFast', false, true, 'Merchant ID', 'Store PayFast merchant key and passphrase in Supabase secrets.', '{"secretNames": ["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY", "PAYFAST_PASSPHRASE"]}'::jsonb)
ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  public_key_label = EXCLUDED.public_key_label,
  integration_notes = EXCLUDED.integration_notes,
  metadata = EXCLUDED.metadata;
