# Admin Dashboard Endpoints - Complete Implementation

## Overview
This document describes all admin dashboard endpoints available for the frontend team.

## Status: ✅ ALL ENDPOINTS IMPLEMENTED

### Authentication Endpoints:
- **Authentication** (JWT-based)
  - `POST /api/auth/login/` - Admin login with JWT tokens
  - `POST /api/auth/logout/` - Logout
  - `GET /api/auth/me/` - Get current user
  - `GET /api/auth/get_all_users/` - Get all users
  - `POST /api/auth/token/refresh/` - Refresh JWT token

- **Alerts Management**
  - `GET /api/alerts/` - List all alerts (with filtering)
  - `POST /api/alerts/` - Create alert
  - `GET /api/alerts/{id}/` - Get single alert
  - `PATCH /api/alerts/{id}/` - Update alert
  - `DELETE /api/alerts/{id}/` - Delete alert
  - `GET /api/alerts/latest/?limit=10` - Get latest alerts
  - `GET /api/alerts/by_severity/` - Get severity counts
  - `GET /api/alerts/by_status/` - Get status counts
  - `PATCH /api/alerts/{id}/mark_reviewed/` - Mark as reviewed
  - `PATCH /api/alerts/{id}/mark_resolved/` - Mark as resolved

- **Dashboard Stats** (in `api` app)
  - `GET /api/dashboard/stats/` - Aggregated dashboard statistics
  - `GET /api/dashboard/alerts-trend/` - Alerts trend for charts

- **Patients Management**
  - `GET /api/patients/` - List all patients
  - `POST /api/patients/` - Create patient
  - `GET /api/patients/{id}/` - Get patient details
  - `PATCH /api/patients/{id}/` - Update patient
  - `DELETE /api/patients/{id}/` - Delete patient
  - `GET /api/patients/unassigned/` - Get unassigned patients

- **Clinicians Management**
  - `GET /api/clinicians/` - List all clinicians
  - `POST /api/clinicians/` - Create clinician
  - `GET /api/clinicians/{id}/` - Get clinician details
  - `PATCH /api/clinicians/{id}/` - Update clinician
  - `DELETE /api/clinicians/{id}/` - Delete clinician
  - `POST /api/clinicians/{id}/assign_patient/` - Assign patient
  - `POST /api/clinicians/{id}/unassign_patient/` - Unassign patient

---

## File Structure

```
backend/
├── api/
│   ├── views.py          ✅ Dashboard stats endpoints
│   └── urls.py           ✅ API routes
├── patients/
│   ├── views.py          ✅ Patient CRUD endpoints
│   └── urls.py           ✅ Patient routes
├── clinicians/
│   ├── views.py          ✅ Clinician CRUD endpoints
│   └── urls.py           ✅ Clinician routes
├── alerts/
│   ├── views.py          ✅ Alert management endpoints
│   └── urls.py           ✅ Alert routes
├── accounts/
│   ├── views.py          ✅ Authentication endpoints
│   └── urls.py           ✅ Auth routes
└── Graphene_trace/
    └── urls.py           ✅ Main URL configuration
```

---

## Implementation Details

### 1. Patients Management (`backend/patients/views.py`)

**Purpose:** CRUD operations for patient management

**Implementation:**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import PatientProfile
from accounts.models import User


class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Patient management
    """
    queryset = PatientProfile.objects.all().select_related('patient', 'clinician')
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """List all patients with their details"""
        patients = self.get_queryset()
        data = [{
            'id': p.patient.id,
            'full_name': p.patient.full_name,
            'email': p.patient.email,
            'username': p.patient.username,
            'date_of_birth': p.date_of_birth,
            'risk_category': p.risk_category,
            'medical_notes': p.medical_notes,
            'clinician': {
                'id': p.clinician.id if p.clinician else None,
                'full_name': p.clinician.full_name if p.clinician else None,
            } if p.clinician else None,
            'created_at': p.patient.created_at
        } for p in patients]
        
        return Response(data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """Get single patient details"""
        try:
            p = PatientProfile.objects.select_related('patient', 'clinician').get(patient_id=pk)
            data = {
                'id': p.patient.id,
                'full_name': p.patient.full_name,
                'email': p.patient.email,
                'username': p.patient.username,
                'date_of_birth': p.date_of_birth,
                'risk_category': p.risk_category,
                'medical_notes': p.medical_notes,
                'clinician': {
                    'id': p.clinician.id,
                    'full_name': p.clinician.full_name
                } if p.clinician else None,
                'created_at': p.patient.created_at
            }
            return Response(data, status=status.HTTP_200_OK)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def create(self, request):
        """Create new patient with user account"""
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        username = request.data.get('username')
        date_of_birth = request.data.get('date_of_birth')
        risk_category = request.data.get('risk_category', 'low')
        medical_notes = request.data.get('medical_notes', '')
        clinician_id = request.data.get('clinician_id')
        
        if not email or not password or not username:
            return Response(
                {'error': 'Email, password, and username are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create user account
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                full_name=full_name,
                role='patient'
            )
            
            # Create patient profile
            clinician = None
            if clinician_id:
                try:
                    clinician = User.objects.get(id=clinician_id, role='clinician')
                except User.DoesNotExist:
                    pass
            
            PatientProfile.objects.create(
                patient=user,
                date_of_birth=date_of_birth,
                risk_category=risk_category,
                medical_notes=medical_notes,
                clinician=clinician
            )
            
            return Response({
                'message': 'Patient created successfully',
                'patient': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """Update patient information"""
        try:
            patient_profile = PatientProfile.objects.get(patient_id=pk)
            user = patient_profile.patient
            
            # Update user fields
            if 'full_name' in request.data:
                user.full_name = request.data['full_name']
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()
            
            # Update patient profile fields
            if 'date_of_birth' in request.data:
                patient_profile.date_of_birth = request.data['date_of_birth']
            if 'risk_category' in request.data:
                patient_profile.risk_category = request.data['risk_category']
            if 'medical_notes' in request.data:
                patient_profile.medical_notes = request.data['medical_notes']
            if 'clinician_id' in request.data:
                clinician_id = request.data['clinician_id']
                if clinician_id:
                    try:
                        patient_profile.clinician = User.objects.get(id=clinician_id, role='clinician')
                    except User.DoesNotExist:
                        return Response({'error': 'Clinician not found'}, status=status.HTTP_404_NOT_FOUND)
                else:
                    patient_profile.clinician = None
            
            patient_profile.save()
            
            return Response({'message': 'Patient updated successfully'}, status=status.HTTP_200_OK)
            
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, pk=None):
        """Delete patient (and associated user account)"""
        try:
            patient_profile = PatientProfile.objects.get(patient_id=pk)
            user = patient_profile.patient
            user.delete()  # Cascade deletes patient profile
            
            return Response({'message': 'Patient deleted successfully'}, status=status.HTTP_200_OK)
            
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def unassigned(self, request):
        """Get all patients without assigned clinicians"""
        patients = PatientProfile.objects.filter(clinician__isnull=True).select_related('patient')
        data = [{
            'id': p.patient.id,
            'full_name': p.patient.full_name,
            'email': p.patient.email,
            'risk_category': p.risk_category
        } for p in patients]
        
        return Response(data, status=status.HTTP_200_OK)
```

---

### 2. Clinicians Management (`backend/clinicians/views.py`)

**Purpose:** CRUD operations for clinician management and patient assignments

**Implementation:**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Clinician
from accounts.models import User
from patients.models import PatientProfile


class ClinicianViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Clinician management
    """
    queryset = Clinician.objects.all().select_related('user')
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """List all clinicians with their details"""
        clinicians = self.get_queryset()
        data = [{
            'id': c.user.id,
            'full_name': c.user.full_name,
            'email': c.user.email,
            'username': c.user.username,
            'specialty': c.specialty,
            'assigned_patients_count': PatientProfile.objects.filter(clinician=c.user).count(),
            'created_at': c.user.created_at
        } for c in clinicians]
        
        return Response(data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """Get single clinician details with assigned patients"""
        try:
            clinician = Clinician.objects.select_related('user').get(user_id=pk)
            assigned_patients = PatientProfile.objects.filter(clinician=clinician.user).select_related('patient')
            
            data = {
                'id': clinician.user.id,
                'full_name': clinician.user.full_name,
                'email': clinician.user.email,
                'username': clinician.user.username,
                'specialty': clinician.specialty,
                'assigned_patients': [{
                    'id': p.patient.id,
                    'full_name': p.patient.full_name,
                    'email': p.patient.email,
                    'risk_category': p.risk_category
                } for p in assigned_patients],
                'assigned_patients_count': assigned_patients.count(),
                'created_at': clinician.user.created_at
            }
            return Response(data, status=status.HTTP_200_OK)
        except Clinician.DoesNotExist:
            return Response({'error': 'Clinician not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def create(self, request):
        """Create new clinician with user account"""
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        username = request.data.get('username')
        specialty = request.data.get('specialty', '')
        
        if not email or not password or not username:
            return Response(
                {'error': 'Email, password, and username are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create user account
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                full_name=full_name,
                role='clinician'
            )
            
            # Create clinician profile
            Clinician.objects.create(user=user, specialty=specialty)
            
            return Response({
                'message': 'Clinician created successfully',
                'clinician': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'specialty': specialty
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """Update clinician information"""
        try:
            clinician = Clinician.objects.get(user_id=pk)
            user = clinician.user
            
            # Update user fields
            if 'full_name' in request.data:
                user.full_name = request.data['full_name']
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()
            
            # Update clinician profile fields
            if 'specialty' in request.data:
                clinician.specialty = request.data['specialty']
            clinician.save()
            
            return Response({'message': 'Clinician updated successfully'}, status=status.HTTP_200_OK)
            
        except Clinician.DoesNotExist:
            return Response({'error': 'Clinician not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, pk=None):
        """Delete clinician (and associated user account)"""
        try:
            clinician = Clinician.objects.get(user_id=pk)
            user = clinician.user
            
            # Unassign all patients first
            PatientProfile.objects.filter(clinician=user).update(clinician=None)
            
            user.delete()  # Cascade deletes clinician profile
            
            return Response({'message': 'Clinician deleted successfully'}, status=status.HTTP_200_OK)
            
        except Clinician.DoesNotExist:
            return Response({'error': 'Clinician not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def assign_patient(self, request, pk=None):
        """Assign a patient to this clinician"""
        try:
            clinician = Clinician.objects.get(user_id=pk)
            patient_id = request.data.get('patient_id')
            
            if not patient_id:
                return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                patient_profile = PatientProfile.objects.get(patient_id=patient_id)
                patient_profile.clinician = clinician.user
                patient_profile.save()
                
                return Response({'message': 'Patient assigned successfully'}, status=status.HTTP_200_OK)
                
            except PatientProfile.DoesNotExist:
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
                
        except Clinician.DoesNotExist:
            return Response({'error': 'Clinician not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def unassign_patient(self, request, pk=None):
        """Unassign a patient from this clinician"""
        try:
            clinician = Clinician.objects.get(user_id=pk)
            patient_id = request.data.get('patient_id')
            
            if not patient_id:
                return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                patient_profile = PatientProfile.objects.get(patient_id=patient_id, clinician=clinician.user)
                patient_profile.clinician = None
                patient_profile.save()
                
                return Response({'message': 'Patient unassigned successfully'}, status=status.HTTP_200_OK)
                
            except PatientProfile.DoesNotExist:
                return Response({'error': 'Patient not found or not assigned to this clinician'}, status=status.HTTP_404_NOT_FOUND)
                
        except Clinician.DoesNotExist:
            return Response({'error': 'Clinician not found'}, status=status.HTTP_404_NOT_FOUND)
```

---

## Testing Instructions

Once the views are implemented, test with:

### 1. Login and Get Token
```bash
POST /api/auth/login/
Body: {"email": "admin@example.com", "password": "admin123"}
```

### 2. Use Token in Headers
```
Authorization: Bearer <access_token>
```

### 3. Test Dashboard Stats
```bash
GET /api/dashboard/stats/
GET /api/dashboard/alerts-trend/
```

### 4. Test Patients
```bash
GET /api/patients/
POST /api/patients/
GET /api/patients/1/
PATCH /api/patients/1/
```

### 5. Test Clinicians
```bash
GET /api/clinicians/
POST /api/clinicians/
GET /api/clinicians/1/
```

---

## Authentication

All endpoints require JWT authentication. Include the access token in the request header:

```
Authorization: Bearer <access_token>
```

Get tokens by logging in at `POST /api/auth/login/` with admin credentials.
