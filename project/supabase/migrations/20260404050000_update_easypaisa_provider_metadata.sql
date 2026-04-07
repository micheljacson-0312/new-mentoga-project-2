UPDATE payment_provider_settings
SET
  public_key_label = 'Store ID',
  integration_notes = 'Store Easypaisa Store ID and API credentials key in Supabase secrets, then submit Mobile Account transactions from the Easypaisa edge function.',
  metadata = '{"secretNames": ["EASYPAISA_STORE_ID", "EASYPAISA_API_KEY"]}'::jsonb
WHERE provider = 'easypaisa';
