-- ================================================
-- RAZORPAY CREDENTIALS MANAGEMENT MIGRATION
-- ================================================
-- This migration creates a secure credential storage system with encryption,
-- audit logging, and proper access controls for payment gateway credentials.

-- ================================================
-- 1. RAZORPAY CREDENTIALS TABLE
-- ================================================

CREATE TABLE razorpay_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(50) NOT NULL CHECK (environment IN ('production', 'test')),
  key_id_encrypted TEXT NOT NULL,
  key_secret_encrypted TEXT NOT NULL,
  webhook_secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_environment_per_credential UNIQUE (environment)
);

-- ================================================
-- 2. ENCRYPTION/DECRYPTION FUNCTIONS
-- ================================================

-- Function to encrypt credential data
CREATE OR REPLACE FUNCTION encrypt_credential(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF plain_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(pgp_sym_encrypt(plain_text, encryption_key), 'base64');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Encryption failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt credential data
CREATE OR REPLACE FUNCTION decrypt_credential(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF encrypted_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active Razorpay credentials with decryption
CREATE OR REPLACE FUNCTION get_active_razorpay_credentials(env TEXT, encryption_key TEXT)
RETURNS TABLE (
  key_id TEXT,
  key_secret TEXT,
  webhook_secret TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    decrypt_credential(key_id_encrypted, encryption_key) as key_id,
    decrypt_credential(key_secret_encrypted, encryption_key) as key_secret,
    decrypt_credential(webhook_secret_encrypted, encryption_key) as webhook_secret
  FROM razorpay_credentials
  WHERE environment = env AND is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 3. PAYMENT CONFIGURATIONS ENHANCEMENTS
-- ================================================

-- Add new columns to existing payment_configurations table
ALTER TABLE payment_configurations 
ADD COLUMN IF NOT EXISTS gateway_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS retry_attempts INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS retry_delay_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS webhook_timeout_seconds INTEGER DEFAULT 10;

-- ================================================
-- 4. AUDIT LOGGING INFRASTRUCTURE
-- ================================================

-- Create audit log table
CREATE TABLE payment_config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_payment_config_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Get user ID from auth context
  user_id := auth.uid();
  
  -- Prepare old and new data (excluding encrypted fields)
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    -- Remove encrypted fields from audit log
    IF TG_TABLE_NAME = 'razorpay_credentials' THEN
      old_data := old_data - 'key_id_encrypted' - 'key_secret_encrypted' - 'webhook_secret_encrypted';
    ELSIF TG_TABLE_NAME = 'bank_accounts' THEN
      old_data := old_data - 'encrypted_account_data';
    END IF;
    
    INSERT INTO payment_config_audit_log (
      table_name, record_id, action, old_values, changed_by
    ) VALUES (
      TG_TABLE_NAME, OLD.id, TG_OP, old_data, user_id
    );
    RETURN OLD;
    
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    -- Remove encrypted fields from audit log
    IF TG_TABLE_NAME = 'razorpay_credentials' THEN
      new_data := new_data - 'key_id_encrypted' - 'key_secret_encrypted' - 'webhook_secret_encrypted';
    ELSIF TG_TABLE_NAME = 'bank_accounts' THEN
      new_data := new_data - 'encrypted_account_data';
    END IF;
    
    INSERT INTO payment_config_audit_log (
      table_name, record_id, action, new_values, changed_by
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, new_data, user_id
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    -- Remove encrypted fields from audit log
    IF TG_TABLE_NAME = 'razorpay_credentials' THEN
      old_data := old_data - 'key_id_encrypted' - 'key_secret_encrypted' - 'webhook_secret_encrypted';
      new_data := new_data - 'key_id_encrypted' - 'key_secret_encrypted' - 'webhook_secret_encrypted';
    ELSIF TG_TABLE_NAME = 'bank_accounts' THEN
      old_data := old_data - 'encrypted_account_data';
      new_data := new_data - 'encrypted_account_data';
    END IF;
    
    INSERT INTO payment_config_audit_log (
      table_name, record_id, action, old_values, new_values, changed_by
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, old_data, new_data, user_id
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 5. INDEXES FOR PERFORMANCE
-- ================================================

-- Indexes on razorpay_credentials
CREATE INDEX idx_razorpay_credentials_environment_active 
  ON razorpay_credentials(environment, is_active);

CREATE INDEX idx_razorpay_credentials_last_used 
  ON razorpay_credentials(last_used_at);

-- Indexes on payment_configurations
CREATE INDEX idx_payment_configurations_gateway_type 
  ON payment_configurations(gateway_type, is_active) 
  WHERE gateway_type IS NOT NULL;

-- Indexes on audit log
CREATE INDEX idx_payment_audit_log_table_record 
  ON payment_config_audit_log(table_name, record_id);

CREATE INDEX idx_payment_audit_log_user_time 
  ON payment_config_audit_log(changed_by, changed_at);

CREATE INDEX idx_payment_audit_log_changed_at 
  ON payment_config_audit_log(changed_at DESC);

-- ================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on new tables
ALTER TABLE razorpay_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for razorpay_credentials
CREATE POLICY "Only super_admins can view razorpay credentials"
  ON razorpay_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Only super_admins can insert razorpay credentials"
  ON razorpay_credentials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Only super_admins can update razorpay credentials"
  ON razorpay_credentials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Only super_admins can delete razorpay credentials"
  ON razorpay_credentials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for payment_config_audit_log
CREATE POLICY "Admins can view audit logs"
  ON payment_config_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON payment_config_audit_log FOR INSERT
  WITH CHECK (true);

-- ================================================
-- 7. TRIGGERS FOR AUTOMATED AUDIT LOGGING
-- ================================================

-- Trigger for razorpay_credentials
CREATE TRIGGER audit_razorpay_credentials_changes
  AFTER INSERT OR UPDATE OR DELETE ON razorpay_credentials
  FOR EACH ROW EXECUTE FUNCTION audit_payment_config_changes();

-- Trigger for payment_configurations
CREATE TRIGGER audit_payment_configurations_changes
  AFTER INSERT OR UPDATE OR DELETE ON payment_configurations
  FOR EACH ROW EXECUTE FUNCTION audit_payment_config_changes();

-- Trigger for bank_accounts
CREATE TRIGGER audit_bank_accounts_changes
  AFTER INSERT OR UPDATE OR DELETE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION audit_payment_config_changes();

-- ================================================
-- 8. HELPER VIEWS FOR ADMIN DASHBOARD
-- ================================================

CREATE OR REPLACE VIEW vw_payment_settings_summary AS
SELECT 
  'razorpay' as settings_type,
  rc.id,
  rc.environment,
  CONCAT('rzp_', REPEAT('*', 8), RIGHT(rc.key_id_encrypted, 3)) as masked_key_id,
  rc.is_active,
  rc.last_used_at,
  rc.updated_at,
  u.email as created_by_email
FROM razorpay_credentials rc
LEFT JOIN users u ON rc.created_by = u.id

UNION ALL

SELECT 
  'payment_config' as settings_type,
  pc.id,
  pc.gateway_type as environment,
  pc.config_key as masked_key_id,
  pc.is_active,
  NULL as last_used_at,
  pc.updated_at,
  NULL as created_by_email
FROM payment_configurations pc

UNION ALL

SELECT 
  'bank_account' as settings_type,
  ba.id,
  'N/A' as environment,
  CONCAT(ba.bank_name, ' - ', REPEAT('*', 8), RIGHT(ba.account_number, 4)) as masked_key_id,
  ba.is_active,
  NULL as last_used_at,
  ba.updated_at,
  NULL as created_by_email
FROM bank_accounts ba;

-- Grant access to view for admins
GRANT SELECT ON vw_payment_settings_summary TO authenticated;

-- RLS policy for view
CREATE POLICY "Admins can view payment settings summary"
  ON vw_payment_settings_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ================================================
-- 9. INITIAL DATA SEEDING
-- ================================================

-- Insert default payment gateway configurations
INSERT INTO payment_configurations (config_key, config_value, gateway_type, is_active, retry_attempts, retry_delay_seconds, webhook_timeout_seconds)
VALUES 
  ('payment_timeout_minutes', '15', 'razorpay', true, 3, 30, 10),
  ('max_payment_retries', '3', 'razorpay', true, 3, 30, 10),
  ('webhook_retry_delay', '30', 'razorpay', true, 3, 30, 10),
  ('payment_expiry_buffer_minutes', '5', 'razorpay', true, 3, 30, 10)
ON CONFLICT (config_key) DO NOTHING;

-- ================================================
-- 10. MIGRATION ROLLBACK SUPPORT
-- ================================================

-- ROLLBACK INSTRUCTIONS (Run these in reverse order if rollback is needed):
/*

-- Drop triggers
DROP TRIGGER IF EXISTS audit_bank_accounts_changes ON bank_accounts;
DROP TRIGGER IF EXISTS audit_payment_configurations_changes ON payment_configurations;
DROP TRIGGER IF EXISTS audit_razorpay_credentials_changes ON razorpay_credentials;

-- Drop view
DROP VIEW IF EXISTS vw_payment_settings_summary;

-- Drop audit log table
DROP TABLE IF EXISTS payment_config_audit_log;

-- Remove added columns from payment_configurations
ALTER TABLE payment_configurations 
DROP COLUMN IF EXISTS webhook_timeout_seconds,
DROP COLUMN IF EXISTS retry_delay_seconds,
DROP COLUMN IF EXISTS retry_attempts,
DROP COLUMN IF EXISTS gateway_type;

-- Drop functions
DROP FUNCTION IF EXISTS get_active_razorpay_credentials(TEXT, TEXT);
DROP FUNCTION IF EXISTS decrypt_credential(TEXT, TEXT);
DROP FUNCTION IF EXISTS encrypt_credential(TEXT, TEXT);
DROP FUNCTION IF EXISTS audit_payment_config_changes();

-- Drop credentials table
DROP TABLE IF EXISTS razorpay_credentials;

*/
