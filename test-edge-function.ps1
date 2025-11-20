# Test Edge Function Deployment
# This script tests if the generate-thumbnail Edge Function is deployed and working

$SUPABASE_URL = "https://zyozjzfkmmtuxvjgryhk.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODg5MjUsImV4cCI6MjA3NjQ2NDkyNX0.ROynm9iOj8vvCZtZbuaxT0Jxll-aYU9Vrch7kvb_pPQ"

Write-Host "🧪 Testing Edge Function..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if function exists (OPTIONS request)
Write-Host "Test 1: Checking CORS preflight (OPTIONS)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest `
        -Uri "$SUPABASE_URL/functions/v1/generate-thumbnail" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "http://localhost:8082"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "authorization, content-type, apikey"
        } `
        -UseBasicParsing `
        -ErrorAction Stop

    Write-Host "✅ CORS preflight passed!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   CORS Headers:" -ForegroundColor Gray
    $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "   - $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ CORS preflight failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 This means the Edge Function is NOT deployed yet." -ForegroundColor Yellow
    Write-Host "   Run: supabase functions deploy generate-thumbnail" -ForegroundColor White
    exit 1
}

Write-Host ""

# Test 2: Try to call the function
Write-Host "Test 2: Calling function with test data..." -ForegroundColor Yellow
try {
    $body = @{
        description = "A space adventure with robots and lasers"
    } | ConvertTo-Json

    $response = Invoke-WebRequest `
        -Uri "$SUPABASE_URL/functions/v1/generate-thumbnail" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $ANON_KEY"
            "apikey" = $ANON_KEY
        } `
        -Body $body `
        -UseBasicParsing `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Function executed successfully!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response:" -ForegroundColor Gray
    Write-Host "   - Thumbnail URL: $($result.thumbnailUrl)" -ForegroundColor Gray
    Write-Host "   - Protagonist: $($result.protagonist)" -ForegroundColor Gray
    Write-Host "   - Genre: $($result.genre)" -ForegroundColor Gray
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️  Function call failed with status: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 500) {
        Write-Host "   This usually means:" -ForegroundColor Gray
        Write-Host "   - RAPIDAPI_KEY not set in Supabase Edge Function Secrets" -ForegroundColor White
        Write-Host "   - Thumbnails storage bucket doesn't exist" -ForegroundColor White
        Write-Host "   - Check Supabase logs for details" -ForegroundColor White
    } elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "   Authentication issue - check ANON_KEY" -ForegroundColor White
    }
    
    try {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorBody.error)" -ForegroundColor Red
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   Function URL: $SUPABASE_URL/functions/v1/generate-thumbnail" -ForegroundColor Gray
Write-Host "   Next steps: See DEPLOYMENT_CHECKLIST.md" -ForegroundColor Gray
