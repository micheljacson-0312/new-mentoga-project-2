UPDATE payment_provider_settings
SET
  public_key_label = 'Merchant ID',
  integration_notes = 'Store JazzCash Merchant ID, Password, Integrity Salt, and Return URL base in Supabase secrets for MWALLET SOAP requests.',
  metadata = '{"secretNames": ["JAZZCASH_MERCHANT_ID", "JAZZCASH_PASSWORD", "JAZZCASH_INTEGRITY_SALT", "JAZZCASH_RETURN_URL"]}'::jsonb
WHERE provider = 'jazzcash';
