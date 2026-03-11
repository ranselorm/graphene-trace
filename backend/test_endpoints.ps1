# Test script for all endpoints
Write-Host "=== Testing Graphene Trace API Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/health/
Write-Host "`n"

# Test 2: Login
Write-Host "2. Testing Login..." -ForegroundColor Yellow
$loginResponse = curl.exe -s -X POST http://localhost:8000/api/auth/login/ -H "Content-Type: application/json" -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'
$loginData = $loginResponse | ConvertFrom-Json
$token = $loginData.access
Write-Host "Login successful! Token received."
Write-Host "User: $($loginData.user.email) - Role: $($loginData.user.role)"
Write-Host "`n"

# Test 3: Get Current User
Write-Host "3. Testing Get Current User..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/auth/me/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 4: Get All Users
Write-Host "4. Testing Get All Users..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/auth/get_all_users/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 5: Dashboard Stats
Write-Host "5. Testing Dashboard Stats..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/dashboard/stats/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 6: Alerts Trend
Write-Host "6. Testing Alerts Trend..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/dashboard/alerts-trend/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 7: List Alerts
Write-Host "7. Testing List Alerts..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/alerts/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 8: List Patients
Write-Host "8. Testing List Patients..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/patients/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 9: List Clinicians
Write-Host "9. Testing List Clinicians..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/clinicians/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 10: Get Unassigned Patients
Write-Host "10. Testing Get Unassigned Patients..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/patients/unassigned/ -H "Authorization: Bearer $token"
Write-Host "`n"

Write-Host "=== All Tests Complete ===" -ForegroundColor Green
