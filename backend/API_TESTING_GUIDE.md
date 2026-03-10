# API Testing Guide - Graphene Trace

## Overview
This guide explains how all the endpoints work and how to test them.

## How the API is Structured

### URL Routing Flow

```
Request: http://localhost:8000/api/auth/login/
         ↓
Main URLs (Graphene_trace/urls.py)
         ↓
Routes to: accounts.urls (because of /api/auth/)
         ↓
accounts/urls.py finds: path('login/', views.login_view)
         ↓
Executes: accounts/views.py → login_view function
         ↓
Returns: JSON response with JWT tokens
```

### Main URL Configuration

**File:** `backend/Graphene_trace/urls.py`

This is the **root router** that directs all incoming requests:

```python
urlpatterns = [
    path("admin/", admin.site.urls),                    # Django admin
    path("api/health/", health),                        # Health check
    path("api/auth/", include('accounts.urls')),        # → accounts app
    path("api/alerts/", include('alerts.urls')),        # → alerts app
    path("api/patients/", include('patients.urls')),    # → patients app
    path("api/clinicians/", include('clinicians.urls')),# → clinicians app
    path("api/dashboard/", include('api.urls')),        # → api app
]
```

### App-Level URL Configurations

Each app has its own `urls.py` that defines specific endpoints:

#### 1. Authentication (`accounts/urls.py`)
Uses **function-based views**:
```python
urlpatterns = [
    path('login/', views.login_view),           # POST /api/auth/login/
    path('logout/', views.logout_view),         # POST /api/auth/logout/
    path('me/', views.current_user),            # GET /api/auth/me/
    path('get_all_users/', views.get_all_users),# GET /api/auth/get_all_users/
    path('token/refresh/', TokenRefreshView),   # POST /api/auth/token/refresh/
]
```

#### 2. Alerts, Patients, Clinicians
Use **ViewSet with Router** (auto-generates CRUD endpoints):
```python
router = DefaultRouter()
router.register(r'', AlertViewSet, basename='alert')
```

This automatically creates:
- `GET /api/alerts/` - List all
- `POST /api/alerts/` - Create new
- `GET /api/alerts/{id}/` - Get one
- `PATCH /api/alerts/{id}/` - Update
- `DELETE /api/alerts/{id}/` - Delete
- Plus custom `@action` endpoints

#### 3. Dashboard (`api/urls.py`)
Uses **function-based views**:
```python
urlpatterns = [
    path('stats/', views.dashboard_stats),      # GET /api/dashboard/stats/
    path('alerts-trend/', views.alerts_trend),  # GET /api/dashboard/alerts-trend/
]
```

---

## Complete Endpoint Reference

### Authentication Endpoints

#### 1. Login
```bash
POST /api/auth/login/
Content-Type: application/json

Body:
{
  "email": "admin@example.com",
  "password": "admin123"
}

Response:
{
  "message": "Login successful",
  "access": "<JWT_ACCESS_TOKEN>",
  "refresh": "<JWT_REFRESH_TOKEN>",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

#### 2. Get Current User
```bash
GET /api/auth/me/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "id": 1,
  "email": "admin@example.com",
  "full_name": "Admin User",
  "role": "admin"
}
```

#### 3. Get All Users
```bash
GET /api/auth/get_all_users/
Authorization: Bearer <ACCESS_TOKEN>

Response:
[
  {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "admin",
    "username": "admin"
  }
]
```

#### 4. Refresh Token
```bash
POST /api/auth/token/refresh/
Content-Type: application/json

Body:
{
  "refresh": "<REFRESH_TOKEN>"
}

Response:
{
  "access": "<NEW_ACCESS_TOKEN>"
}
```

---

### Dashboard Endpoints

#### 1. Dashboard Stats
```bash
GET /api/dashboard/stats/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "users": {
    "total": 10,
    "patients": 7,
    "clinicians": 2,
    "admins": 1
  },
  "alerts": {
    "by_severity": {"high": 5, "medium": 10, "low": 3, "total": 18},
    "by_status": {"new": 8, "reviewed": 6, "resolved": 4, "total": 18}
  },
  "assignments": {
    "assigned": 5,
    "unassigned": 2,
    "total": 7
  },
  "recent_activity": {
    "alerts_last_7_days": 12,
    "sensor_data_last_7_days": 450
  }
}
```

#### 2. Alerts Trend
```bash
GET /api/dashboard/alerts-trend/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "data": [5, 8, 3, 12, 7, 4, 9]
}
```

---

### Alert Endpoints

#### 1. List All Alerts
```bash
GET /api/alerts/
Authorization: Bearer <ACCESS_TOKEN>

Query Parameters (optional):
- severity=high|medium|low
- status=new|reviewed|resolved
- patient=<patient_id>
- alert_type=<type>

Response:
[
  {
    "id": 1,
    "patient": 2,
    "patient_name": "John Doe",
    "patient_email": "john@email.com",
    "alert_type": "Heart Rate Anomaly",
    "severity": "high",
    "status": "new",
    "message": "Heart rate exceeded 120 bpm",
    "created_at": "2026-03-10T10:30:00Z",
    "time_ago": "2 hours ago"
  }
]
```

#### 2. Create Alert
```bash
POST /api/alerts/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "patient": 2,
  "alert_type": "Heart Rate Anomaly",
  "severity": "high",
  "message": "Heart rate exceeded 120 bpm for 5 minutes"
}

Response:
{
  "id": 1,
  "patient": 2,
  "alert_type": "Heart Rate Anomaly",
  "severity": "high",
  "status": "new",
  "message": "Heart rate exceeded 120 bpm for 5 minutes",
  "created_at": "2026-03-10T10:30:00Z"
}
```

#### 3. Get Single Alert
```bash
GET /api/alerts/1/
Authorization: Bearer <ACCESS_TOKEN>
```

#### 4. Update Alert
```bash
PATCH /api/alerts/1/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "severity": "medium",
  "message": "Updated message"
}
```

#### 5. Delete Alert
```bash
DELETE /api/alerts/1/
Authorization: Bearer <ACCESS_TOKEN>
```

#### 6. Mark as Reviewed
```bash
PATCH /api/alerts/1/mark_reviewed/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "message": "Alert marked as reviewed"
}
```

#### 7. Mark as Resolved
```bash
PATCH /api/alerts/1/mark_resolved/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "message": "Alert marked as resolved"
}
```

#### 8. Get Latest Alerts
```bash
GET /api/alerts/latest/?limit=10
Authorization: Bearer <ACCESS_TOKEN>
```

---

### Patient Endpoints

#### 1. List All Patients
```bash
GET /api/patients/
Authorization: Bearer <ACCESS_TOKEN>

Response:
[
  {
    "id": 2,
    "full_name": "Jane Doe",
    "email": "jane@email.com",
    "username": "janedoe",
    "date_of_birth": "1990-05-15",
    "risk_category": "medium",
    "medical_notes": "Regular checkups needed",
    "clinician": {
      "id": 3,
      "full_name": "Dr. John Smith"
    },
    "created_at": "2026-03-01T10:00:00Z"
  }
]
```

#### 2. Create Patient
```bash
POST /api/patients/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "email": "patient@email.com",
  "password": "password123",
  "username": "patient1",
  "full_name": "Jane Doe",
  "date_of_birth": "1990-05-15",
  "risk_category": "medium",
  "medical_notes": "Regular checkups needed",
  "clinician_id": 3  // optional
}

Response:
{
  "message": "Patient created successfully",
  "patient": {
    "id": 2,
    "email": "patient@email.com",
    "full_name": "Jane Doe"
  }
}
```

#### 3. Get Patient Details
```bash
GET /api/patients/2/
Authorization: Bearer <ACCESS_TOKEN>
```

#### 4. Update Patient
```bash
PATCH /api/patients/2/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "full_name": "Jane Smith",
  "risk_category": "low",
  "clinician_id": 3
}

Response:
{
  "message": "Patient updated successfully"
}
```

#### 5. Delete Patient
```bash
DELETE /api/patients/2/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "message": "Patient deleted successfully"
}
```

#### 6. Get Unassigned Patients
```bash
GET /api/patients/unassigned/
Authorization: Bearer <ACCESS_TOKEN>

Response:
[
  {
    "id": 4,
    "full_name": "John Patient",
    "email": "john@email.com",
    "risk_category": "high"
  }
]
```

---

### Clinician Endpoints

#### 1. List All Clinicians
```bash
GET /api/clinicians/
Authorization: Bearer <ACCESS_TOKEN>

Response:
[
  {
    "id": 3,
    "full_name": "Dr. John Smith",
    "email": "dr.smith@hospital.com",
    "username": "drsmith",
    "specialty": "Cardiology",
    "assigned_patients_count": 5,
    "created_at": "2026-03-01T09:00:00Z"
  }
]
```

#### 2. Create Clinician
```bash
POST /api/clinicians/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "email": "dr.smith@hospital.com",
  "password": "password123",
  "username": "drsmith",
  "full_name": "Dr. John Smith",
  "specialty": "Cardiology"
}

Response:
{
  "message": "Clinician created successfully",
  "clinician": {
    "id": 3,
    "email": "dr.smith@hospital.com",
    "full_name": "Dr. John Smith",
    "specialty": "Cardiology"
  }
}
```

#### 3. Get Clinician Details
```bash
GET /api/clinicians/3/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "id": 3,
  "full_name": "Dr. John Smith",
  "email": "dr.smith@hospital.com",
  "username": "drsmith",
  "specialty": "Cardiology",
  "assigned_patients": [
    {
      "id": 2,
      "full_name": "Jane Doe",
      "email": "jane@email.com",
      "risk_category": "medium"
    }
  ],
  "assigned_patients_count": 1,
  "created_at": "2026-03-01T09:00:00Z"
}
```

#### 4. Update Clinician
```bash
PATCH /api/clinicians/3/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "full_name": "Dr. John Smith Jr.",
  "specialty": "Pediatric Cardiology"
}

Response:
{
  "message": "Clinician updated successfully"
}
```

#### 5. Delete Clinician
```bash
DELETE /api/clinicians/3/
Authorization: Bearer <ACCESS_TOKEN>

Response:
{
  "message": "Clinician deleted successfully"
}
```

#### 6. Assign Patient to Clinician
```bash
POST /api/clinicians/3/assign_patient/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "patient_id": 2
}

Response:
{
  "message": "Patient assigned successfully"
}
```

#### 7. Unassign Patient from Clinician
```bash
POST /api/clinicians/3/unassign_patient/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

Body:
{
  "patient_id": 2
}

Response:
{
  "message": "Patient unassigned successfully"
}
```

---

## Testing with Hoppscotch

### Step 1: Login
1. Open Hoppscotch
2. Set method to `POST`
3. URL: `http://localhost:8000/api/auth/login/`
4. Headers: `Content-Type: application/json`
5. Body (JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```
6. Click Send
7. Copy the `access` token from the response

### Step 2: Test Other Endpoints
1. For any protected endpoint
2. Add Header: `Authorization: Bearer <paste_access_token_here>`
3. Set the appropriate method (GET, POST, PATCH, DELETE)
4. Add body if needed (for POST/PATCH)
5. Click Send

---

## Common Errors and Solutions

### 1. 403 Forbidden
- **Cause:** Missing or invalid JWT token
- **Solution:** Make sure you include `Authorization: Bearer <token>` header

### 2. 404 Not Found
- **Cause:** Wrong URL or missing ID in path
- **Solution:** Check the URL matches the patterns above

### 3. 400 Bad Request
- **Cause:** Missing required fields or invalid data
- **Solution:** Check the request body matches the expected format

### 4. 401 Unauthorized
- **Cause:** Token expired
- **Solution:** Login again to get a new token, or use refresh token endpoint

---

## How ViewSets Work

ViewSets are Django REST Framework's way of automatically creating CRUD endpoints:

```python
class PatientViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    
    def list(self, request):        # GET /api/patients/
        # Return all patients
    
    def retrieve(self, request, pk):# GET /api/patients/{pk}/
        # Return one patient
    
    def create(self, request):      # POST /api/patients/
        # Create new patient
    
    def partial_update(self, request, pk):  # PATCH /api/patients/{pk}/
        # Update patient
    
    def destroy(self, request, pk): # DELETE /api/patients/{pk}/
        # Delete patient
    
    @action(detail=False, methods=['get'])
    def unassigned(self, request):  # GET /api/patients/unassigned/
        # Custom endpoint
```

The `DefaultRouter` automatically creates all these URLs for you!

---

## Summary

Your API has 4 main sections:
1. **Authentication** - Login, get user info, manage tokens
2. **Dashboard** - Aggregated stats and trends
3. **Alerts** - Manage patient alerts
4. **Patients & Clinicians** - User management and assignments

All endpoints (except login) require JWT authentication via the `Authorization: Bearer <token>` header.
