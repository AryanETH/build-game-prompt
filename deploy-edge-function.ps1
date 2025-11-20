# Deploy Generate Thumbnail Edge Function
# Run this script to deploy the fixed Edge Function to Supabase

Write-Host "🚀 Deploying generate-thumbnail Edge Function..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Run: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying function..." -ForegroundColor Yellow
supabase functions deploy generate-thumbnail --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚙️  Next steps:" -ForegroundColor Cyan
    Write-Host "1. Set RAPIDAPI_KEY in Supabase Dashboard (Settings > Edge Functions > Secrets)" -ForegroundColor White
    Write-Host "2. Create 'thumbnails' storage bucket (Storage > New Bucket > Public)" -ForegroundColor White
    Write-Host "3. Test the function in your app" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed. Check the error above." -ForegroundColor Red
    Write-Host "💡 Make sure you're logged in: supabase login" -ForegroundColor Yellow
    Write-Host "💡 Make sure project is linked: supabase link --project-ref zyozjzfkmmtuxvjgryhk" -ForegroundColor Yellow
}
