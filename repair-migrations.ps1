# Repair all migrations to mark them as applied
$migrations = @(
    "20241206000001",
    "20251009092750",
    "20251009092758",
    "20251009093000",
    "20251009093500",
    "20251010082802",
    "20251010090000",
    "20251011091907",
    "20251011102000",
    "20251011113000",
    "20251013201917",
    "20251015213521",
    "20251016091500",
    "20251021000000",
    "20251022100000",
    "20251023090000",
    "20251117000000",
    "20251117000001",
    "20251117000002",
    "20251117000003",
    "20251207000000",
    "20251207000001",
    "20251207000002"
)

foreach ($migration in $migrations) {
    Write-Host "Repairing migration: $migration" -ForegroundColor Cyan
    supabase migration repair --status applied $migration
}

Write-Host "`nAll migrations repaired!" -ForegroundColor Green
Write-Host "Run 'supabase migration list' to verify" -ForegroundColor Yellow
