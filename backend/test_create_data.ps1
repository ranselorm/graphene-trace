# Test script for creating data
Write-Host "=== Testing Data Creation Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Login first
Write-Host "Logging in..." -ForegroundColor Yellow
$loginResponse = curl.exe -s -X POST http://localhost:8000/api/auth/login/ -H "Content-Type: application/json" -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'
$loginData = $loginResponse | ConvertFrom-Json
$token = $loginData.access
Write-Host "Token received!`n"

# Test 1: Create a Clinician
Write-Host "1. Creating a Clinician..." -ForegroundColor Yellow
$clinicianData = '{\"email\":\"dr.smith@hospital.com\",\"password\":\"password123\",\"username\":\"drsmith\",\"full_name\":\"Dr. John Smith\",\"specialty\":\"Cardiology\"}'
$clinicianResponse = curl.exe -s -X POST http://localhost:8000/api/clinicians/ -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $clinicianData
Write-Host $clinicianResponse
$clinician = $clinicianResponse | ConvertFrom-Json
$clinicianId = $clinician.clinician.id
Write-Host "`n"

# Test 2: Create a Patient (unassigned)
Write-Host "2. Creating a Patient (unassigned)..." -ForegroundColor Yellow
$patientData = '{\"email\":\"patient1@email.com\",\"password\":\"password123\",\"username\":\"patient1\",\"full_name\":\"Jane Doe\",\"date_of_birth\":\"1990-05-15\",\"risk_category\":\"medium\",\"medical_notes\":\"Regular checkups needed\"}'
$patientResponse = curl.exe -s -X POST http://localhost:8000/api/patients/ -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $patientData
Write-Host $patientResponse
$patient = $patientResponse | ConvertFrom-Json
$patientId = $patient.patient.id
Write-Host "`n"

# Test 3: Create another Patient (with clinician assignment)
Write-Host "3. Creating a Patient (assigned to clinician)..." -ForegroundColor Yellow
$patient2Data = "{`"email`":`"patient2@email.com`",`"password`":`"password123`",`"username`":`"patient2`",`"full_name`":`"John Patient`",`"date_of_birth`":`"1985-08-20`",`"risk_category`":`"high`",`"medical_notes`":`"Requires close monitoring`",`"clinician_id`":$clinicianId}"
$patient2Response = curl.exe -s -X POST http://localhost:8000/api/patients/ -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $patient2Data
Write-Host $patient2Response
Write-Host "`n"

# Test 4: Create an Alert
Write-Host "4. Creating an Alert..." -ForegroundColor Yellow
$alertData = "{`"patient`":$patientId,`"alert_type`":`"Heart Rate Anomaly`",`"severity`":`"high`",`"message`":`"Heart rate exceeded 120 bpm for 5 minutes`"}"
$alertResponse = curl.exe -s -X POST http://localhost:8000/api/alerts/ -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $alertData
Write-Host $alertResponse
$alert = $alertResponse | ConvertFrom-Json
$alertId = $alert.id
Write-Host "`n"

# Test 5: List all data
Write-Host "5. Listing all Clinicians..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/clinicians/ -H "Authorization: Bearer $token"
Write-Host "`n"

Write-Host "6. Listing all Patients..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/patients/ -H "Authorization: Bearer $token"
Write-Host "`n"

Write-Host "7. Listing all Alerts..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/alerts/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 6: Get specific clinician with assigned patients
Write-Host "8. Getting Clinician Details (with assigned patients)..." -ForegroundColor Yellow
curl.exe -s "http://localhost:8000/api/clinicians/$clinicianId/" -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 7: Assign patient to clinician
Write-Host "9. Assigning Patient to Clinician..." -ForegroundColor Yellow
$assignData = "{`"patient_id`":$patientId}"
curl.exe -s -X POST "http://localhost:8000/api/clinicians/$clinicianId/assign_patient/" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $assignData
Write-Host "`n"

# Test 8: Get unassigned patients
Write-Host "10. Getting Unassigned Patients..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/patients/unassigned/ -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 9: Update alert status
Write-Host "11. Marking Alert as Reviewed..." -ForegroundColor Yellow
curl.exe -s -X PATCH "http://localhost:8000/api/alerts/$alertId/mark_reviewed/" -H "Authorization: Bearer $token"
Write-Host "`n"

# Test 10: Dashboard stats with data
Write-Host "12. Getting Dashboard Stats (with data)..." -ForegroundColor Yellow
curl.exe -s http://localhost:8000/api/dashboard/stats/ -H "Authorization: Bearer $token"
Write-Host "`n"

Write-Host "=== All Data Creation Tests Complete ===" -ForegroundColor Green
