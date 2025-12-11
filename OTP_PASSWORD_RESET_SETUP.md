# OTP-Based Password Reset Setup Guide

## Overview
This implements a secure OTP-based password reset system where users receive a 6-digit OTP via email and enter it on the Oplus platform along with their new password.

## Features
- ✅ 6-digit OTP generation and email delivery
- ✅ 10-minute OTP expiration
- ✅ Secure OTP storage with encryption
- ✅ Email template with Oplus branding
- ✅ Resend OTP functionality
- ✅ Automatic cleanup of expired OTPs
- ✅ Rate limiting and security measures

## Setup Steps

### 1. Create Database Table
Run this SQL in **Supabase SQL Editor**:
```sql
-- Copy content from CREATE_PASSWORD_RESET_OTP_TABLE.sql
```

### 2. Deploy Edge Functions
Run in **terminal/command prompt**:
```bash
supabase functions deploy send-password-otp --project-ref your-project-ref
supabase functions deploy verify-password-otp --project-ref your-project-ref
```

### 3. Configure Email Service
In **Supabase Dashboard > Settings > Edge Functions**:
- Add `BREVO_API_KEY` environment variable
- Get API key from your Brevo dashboard (Account > SMTP & API > API Keys)

### 4. Update Email Configuration
In `supabase/functions/send-password-otp/index.ts`:
- Replace `noreply@oplus.com` with your verified Brevo sender email
- Update logo URL to your actual domain
- Ensure sender email is verified in your Brevo account

## How It Works

### User Flow
1. User clicks "Forgot your password?" on login page
2. User enters email address
3. System sends 6-digit OTP to email
4. User enters OTP + new password on Oplus
5. System verifies OTP and updates password
6. User can now login with new password

### Security Features
- OTPs expire after 10 minutes
- Each OTP can only be used once
- Automatic cleanup of expired OTPs
- Rate limiting on OTP generation
- Secure password hashing
- No password reset links (more secure)

### Email Template
- Oplus branded design
- Clear OTP display
- Security warnings
- Professional appearance

## Testing

### Test the Flow
1. Go to login page
2. Click "Forgot your password?"
3. Enter your email
4. Check email for OTP
5. Enter OTP + new password
6. Verify login works with new password

### Debug Issues
- Check Supabase Edge Function logs
- Verify RESEND_API_KEY is set
- Check email spam folder
- Verify database table exists
- Check console for errors

## Files Created/Modified
- `supabase/functions/send-password-otp/index.ts` - OTP generation & email
- `supabase/functions/verify-password-otp/index.ts` - OTP verification & password reset
- `CREATE_PASSWORD_RESET_OTP_TABLE.sql` - Database table
- `src/pages/Auth.tsx` - Updated UI with OTP flow
- `deploy-otp-functions.ps1` - Deployment script

## Environment Variables Needed
- `BREVO_API_KEY` - For sending emails via Brevo SMTP
- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided

## Security Considerations
- OTPs are single-use and time-limited
- Email addresses are not revealed if they don't exist
- Password requirements enforced (6+ characters)
- Secure password hashing by Supabase Auth
- RLS policies protect OTP table

## Customization Options
- Change OTP expiration time (currently 10 minutes)
- Modify email template design
- Add rate limiting per email address
- Implement SMS OTP as alternative
- Add password strength requirements