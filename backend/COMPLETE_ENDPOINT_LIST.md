# Complete Endpoint List - Graphene Trace API

## All Available Endpoints

### 1. AUTHENTICATION ENDPOINTS (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login/` | Login and get JWT tokens | No |
| POST | `/api/auth/logout/` | Logout | Yes |
| GET | `/api/auth/me/` | Get current user info | Yes |
| GET | `/api/auth/get_all_users/` | Get all users (admin only) | Yes |
| POST | `/api/auth/token/refresh/` | Refresh JWT access token | No (needs refresh token) |

---

### 2. DASHBOARD ENDPOINTS (`/api/dashboard/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/stats/` | Get aggregated dashboard statistics | Yes |
| GET | `/api/dashboard/alerts-trend/` | Get alerts trend data for charts | Yes |

---

### 3. PATIENT ENDPOINTS (`/api/patients/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/patients/` | List all patients | Yes |
| POST | `/api/patients/` | Create new patient | Yes |
| GET | `/api/patients/{id}/` | Get single patient details | Yes |
| PATCH | `/api/patients/{id}/` | Update patient information | Yes |
| DELETE | `/api/patients/{id}/` | Delete patient | Yes |
| GET | `/api/patients/unassigned/` | Get patients without assigned clinician | Yes |

---

### 4. CLINICIAN ENDPOINTS (`/api/clinicians/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/clinicians/` | List all clinicians | Yes |
| POST | `/api/clinicians/` | Create new clinician | Yes |
| GET | `/api/clinicians/{id}/` | Get single clinician details with assigned patients | Yes |
| PATCH | `/api/clinicians/{id}/` | Update clinician information | Yes |
| DELETE | `/api/clinicians/{id}/` | Delete clinician | Yes |
| POST | `/api/clinicians/{id}/assign_patient/` | Assign a patient to this clinician | Yes |
| POST | `/api/clinicians/{id}/unassign_patient/` | Unassign a patient from this clinician | Yes |

---

### 5. ALERT ENDPOINTS (`/api/alerts/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/alerts/` | List all alerts (with filtering) | Yes |
| POST | `/api/alerts/` | Create new alert | Yes |
| GET | `/api/alerts/{id}/` | Get single alert details | Yes |
| PATCH | `/api/alerts/{id}/` | Update alert | Yes |
| DELETE | `/api/alerts/{id}/` | Delete alert | Yes |
| GET | `/api/alerts/latest/` | Get latest alerts (default 10) | Yes |
| GET | `/api/alerts/by_severity/` | Get alert counts by severity | Yes |
| GET | `/api/alerts/by_status/` | Get alert counts by status | Yes |
| PATCH | `/api/alerts/{id}/mark_reviewed/` | Mark alert as reviewed | Yes |
| PATCH | `/api/alerts/{id}/mark_resolved/` | Mark alert as resolved | Yes |

---

### 6. UTILITY ENDPOINTS

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health/` | Health check endpoint | No |
| GET | `/` | Root health check | No |
| GET | `/admin/` | Django admin panel | Yes (admin user) |

---

## Total Endpoint Count

- **Authentication**: 5 endpoints
- **Dashboard**: 2 endpoints
- **Patients**: 6 endpoints
- **Clinicians**: 7 endpoints
- **Alerts**: 10 endpoints
- **Utility**: 3 endpoints

**TOTAL: 33 endpoints**

---

## How Assigned/Unassigned Patients Work

### Understanding Patient Assignment

Every patient has a `clinician` field in their `PatientProfile`:
- If `clinician = NULL` → Patient is **UNASSIGNED**
- If `clinician = <clinician_id>` → Patient is **ASSIGNED** to that clinician

### Getting Assigned Patients

There are **3 ways** to get assigned patients:

#### Method 1: Get ALL Patients (shows assignment status)
```bash
GET /api/patients/
Authorization: Bearer <token>

Response:
[
  {
    "id": 2,
    "full_name": "Jane Doe",
    "email": "jane@email.com",
    "clinician": {
      "id": 3,
      "full_name": "Dr. John Smith"  ← ASSIGNED
    }
  },
  {
    "id": 4,
    "full_name": "Bob Wilson",
    "email": "bob@email.com",
    "clinician": null  ← UNASSIGNED
  }
]
```

#### Method 2: Get Clinician Details (shows their assigned patients)
```bash
GET /api/clinicians/3/
Authorization: Bearer <token>

Response:
{
  "id": 3,
  "full_name": "Dr. John Smith",
  "email": "dr.smith@hospital.com",
  "specialty": "Cardiology",
  "assigned_patients": [  ← All patients assigned to this clinician
    {
      "id": 2,
      "full_name": "Jane Doe",
      "email": "jane@email.com",
      "risk_category": "medium"
    },
    {
      "id": 5,
      "full_name": "John Patient",
      "email": "john@email.com",
      "risk_category": "high"
    }
  ],
  "assigned_patients_count": 2
}
```

#### Method 3: Get ONLY Unassigned Patients
```bash
GET /api/patients/unassigned/
Authorization: Bearer <token>

Response:
[
  {
    "id": 4,
    "full_name": "Bob Wilson",
    "email": "bob@email.com",
    "risk_category": "medium"
  },
  {
    "id": 6,
    "full_name": "Carol Martinez",
    "email": "carol@email.com",
    "risk_category": "high"
  }
]
```

### Assigning/Unassigning Patients

#### To Assign a Patient to a Clinician:

**Option A: During Patient Creation**
```bash
POST /api/patients/
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newpatient@email.com",
  "password": "password123",
  "username": "newpatient",
  "full_name": "New Patient",
  "date_of_birth": "1990-01-01",
  "risk_category": "low",
  "clinician_id": 3  ← Assign to clinician with ID 3
}
```

**Option B: Update Existing Patient**
```bash
PATCH /api/patients/4/
Authorization: Bearer <token>
Content-Type: application/json

{
  "clinician_id": 3  ← Assign patient 4 to clinician 3
}
```

**Option C: Use Clinician's Assign Endpoint**
```bash
POST /api/clinicians/3/assign_patient/
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 4  ← Assign patient 4 to clinician 3
}
```

#### To Unassign a Patient:

**Option A: Update Patient (set to null)**
```bash
PATCH /api/patients/4/
Authorization: Bearer <token>
Content-Type: application/json

{
  "clinician_id": null  ← Remove clinician assignment
}
```

**Option B: Use Clinician's Unassign Endpoint**
```bash
POST /api/clinicians/3/unassign_patient/
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 4  ← Unassign patient 4 from clinician 3
}
```

---

## Workflow Example: Admin Dashboard

### Scenario: Admin wants to assign unassigned patients

1. **Get list of unassigned patients**
   ```bash
   GET /api/patients/unassigned/
   ```
   Returns: `[{id: 4, name: "Bob"}, {id: 6, name: "Carol"}]`

2. **Get list of clinicians**
   ```bash
   GET /api/clinicians/
   ```
   Returns: `[{id: 3, name: "Dr. Smith", assigned_patients_count: 2}, ...]`

3. **Assign patient to clinician**
   ```bash
   POST /api/clinicians/3/assign_patient/
   Body: {"patient_id": 4}
   ```

4. **Verify assignment**
   ```bash
   GET /api/clinicians/3/
   ```
   Now shows Bob in `assigned_patients` array

5. **Check unassigned list again**
   ```bash
   GET /api/patients/unassigned/
   ```
   Bob is no longer in the list!

---

## Summary

- **Assigned Patients**: Patients with a `clinician` value
  - View via: `GET /api/patients/` (check clinician field)
  - View via: `GET /api/clinicians/{id}/` (see assigned_patients array)

- **Unassigned Patients**: Patients with `clinician = null`
  - View via: `GET /api/patients/unassigned/`
  - View via: `GET /api/patients/` (clinician field is null)

- **Assignment Methods**: 
  - Create patient with clinician_id
  - Update patient with clinician_id
  - Use `/api/clinicians/{id}/assign_patient/`

- **Unassignment Methods**:
  - Update patient with clinician_id = null
  - Use `/api/clinicians/{id}/unassign_patient/`
