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
    
    @action(detail=False, methods=['get'])
    def unassigned(self, request):
        patients = PatientProfile.objects.filter(clinician__isnull=True).select_related('patient')
        data = [{
            'id': p.patient.id,
            'full_name': p.patient.full_name,
            'email': p.patient.email,
            'risk_category': p.risk_category
        } for p in patients]
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'patch'])
    def thresholds(self, request, pk=None):
        """
        GET /api/patients/{id}/thresholds/ — view pain thresholds
        PATCH /api/patients/{id}/thresholds/ — update pain thresholds
        
        Body (PATCH):
        {
            "pressure_threshold": 2000,       // 1-4095
            "contact_area_threshold": 50.0,   // 0-100 %
            "duration_threshold": 300          // seconds
        }
        """
        try:
            profile = PatientProfile.objects.get(patient_id=pk)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            return Response({
                'patient_id': pk,
                'pressure_threshold': profile.pressure_threshold,
                'contact_area_threshold': profile.contact_area_threshold,
                'duration_threshold': profile.duration_threshold,
            }, status=status.HTTP_200_OK)

        # PATCH
        if 'pressure_threshold' in request.data:
            val = int(request.data['pressure_threshold'])
            if not 1 <= val <= 4095:
                return Response({'error': 'pressure_threshold must be between 1 and 4095'}, status=status.HTTP_400_BAD_REQUEST)
            profile.pressure_threshold = val

        if 'contact_area_threshold' in request.data:
            val = float(request.data['contact_area_threshold'])
            if not 0 <= val <= 100:
                return Response({'error': 'contact_area_threshold must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)
            profile.contact_area_threshold = val

        if 'duration_threshold' in request.data:
            val = int(request.data['duration_threshold'])
            if val < 0:
                return Response({'error': 'duration_threshold must be positive'}, status=status.HTTP_400_BAD_REQUEST)
            profile.duration_threshold = val

        profile.save()

        return Response({
            'message': 'Thresholds updated successfully',
            'patient_id': pk,
            'pressure_threshold': profile.pressure_threshold,
            'contact_area_threshold': profile.contact_area_threshold,
            'duration_threshold': profile.duration_threshold,
        }, status=status.HTTP_200_OK)
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
