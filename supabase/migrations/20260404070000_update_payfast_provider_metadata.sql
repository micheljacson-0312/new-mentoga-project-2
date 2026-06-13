UPDATE payment_provider_settings
SET
  public_key_label = 'Merchant ID',
  integration_notes = 'Store PayFast merchant credentials in Supabase secrets and use validate + transaction REST calls for wallet/account payments.',
  metadata = '{"secretNames": ["PAYFAST_MERCHANT_ID", "PAYFAST_SECURED_KEY", "PAYFAST_MERCHANT_CATEGORY_CODE", "PAYFAST_ACCOUNT_TYPE_ID"], "requiresFields": ["bank_code", "account_number", "cnic_number", "otp"]}'::jsonb
WHERE provider = 'payfast';
