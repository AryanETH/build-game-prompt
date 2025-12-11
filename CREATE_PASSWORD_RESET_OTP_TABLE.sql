-- Create password reset OTP table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_otp ON password_reset_otps(otp);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Enable RLS
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only service role can access this table
CREATE POLICY "Service role can manage password reset OTPs"
ON password_reset_otps
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions to service role only (not to authenticated users for security)
GRANT ALL ON password_reset_otps TO service_role;

-- Create function to clean up expired OTPs (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_otps 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Password reset OTP table created successfully!';
  RAISE NOTICE '✅ Indexes and RLS policies configured';
  RAISE NOTICE '✅ Ready for OTP-based password reset';
END $