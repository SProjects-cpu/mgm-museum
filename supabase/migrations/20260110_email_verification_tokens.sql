-- Create email_verification_tokens table for credential change verification
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  new_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON email_verification_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own tokens
CREATE POLICY "Users can view own tokens"
ON email_verification_tokens FOR SELECT
USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own tokens
CREATE POLICY "Users can create own tokens"
ON email_verification_tokens FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own tokens
CREATE POLICY "Users can update own tokens"
ON email_verification_tokens FOR UPDATE
USING (user_id = auth.uid());
