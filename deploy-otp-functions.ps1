# Deploy OTP-based password reset edge functions to Supabase

Write-Host "Deploying OTP password reset functions..." -ForegroundColor Green

# Deploy the send OTP function
Write-Host "Deploying send-password-otp function..." -ForegroundColor Yellow
npx supabase functions deploy send-password-otp --project-ref your-project-ref

# Deploy the verify OTP function  
Write-Host "Deploying verify-password-otp function..." -ForegroundColor Yellow
npx supabase functions deploy verify-password-otp --project-ref your-project-ref

Write-Host "Edge functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Complete these steps:" -ForegroundColor Yellow
Write-Host "1. Run CREATE_PASSWORD_RESET_OTP_TABLE.sql in Supabase SQL Editor" -ForegroundColor Yellow
Write-Host "2. Set BREVO_API_KEY environment variable in Supabase Dashboard" -ForegroundColor Yellow
Write-Host "3. Update sender email in send-password-otp function (use your verified Brevo sender)" -ForegroundColor Yellow
Write-Host "4. Verify sender domain is configured in your Brevo account" -ForegroundColor Yellow
Write-Host "5. Test the OTP flow with the forgot password feature" -ForegroundColor Yellow
Write-Host ""
Write-Host "📧 Brevo Setup Guide: See BREVO_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan