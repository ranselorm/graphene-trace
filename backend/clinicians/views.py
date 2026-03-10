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
