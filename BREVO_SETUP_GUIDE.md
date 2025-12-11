# Brevo SMTP Integration for OTP Password Reset

## Quick Setup for Brevo Users

Since you're already using Brevo SMTP, here's the streamlined setup:

### 1. Get Your Brevo API Key
1. Login to your Brevo dashboard
2. Go to **Account** → **SMTP & API** → **API Keys**
3. Create a new API key or copy existing one
4. Name it something like "Oplus OTP System"

### 2. Configure Supabase Environment
In **Supabase Dashboard** → **Settings** → **Edge Functions**:
- Add environment variable: `BREVO_API_KEY`
- Paste your Brevo API key as the value

### 3. Update Sender Email
In `supabase/functions/send-password-otp/index.ts`, line ~85:
```typescript
sender: {
  name: 'Oplus',
  email: 'your-verified-email@yourdomain.com' // Replace with your Brevo verified sender
},
```

### 4. Verify Sender Domain
Make sure your sender email is verified in Brevo:
- **Brevo Dashboard** → **Senders & IP** → **Senders**
- Add and verify your domain if not already done

### 5. Deploy Functions
```bash
supabase functions deploy send-password-otp --project-ref your-project-ref
supabase functions deploy verify-password-otp --project-ref your-project-ref
```

### 6. Create Database Table
Run `CREATE_PASSWORD_RESET_OTP_TABLE.sql` in Supabase SQL Editor

## Brevo Advantages
- ✅ You're already set up with Brevo
- ✅ Better deliverability than many providers
- ✅ Detailed email analytics
- ✅ GDPR compliant
- ✅ Generous free tier (300 emails/day)

## Testing
1. Try the forgot password flow
2. Check Brevo dashboard for email delivery stats
3. Verify OTP emails arrive in inbox (not spam)

## Troubleshooting
- **Email not sending**: Check BREVO_API_KEY is correct
- **Emails in spam**: Verify sender domain in Brevo
- **API errors**: Check Brevo dashboard for account status
- **Rate limits**: Brevo free tier allows 300 emails/day

## Email Template Features
- 🎨 Oplus branded design
- 📱 Mobile responsive
- 🔐 Security warnings
- ⏰ Clear expiration notice
- 🛡️ Professional appearance

Your OTP system is now ready with Brevo integration!