from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Clinician
from patients.models import PatientProfile


class ClinicianViewSet(viewsets.ModelViewSet):
    queryset = Clinician.objects.all()
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        clinicians = Clinician.objects.select_related('user').all()
        data = [{
            'id': c.user.id,
            'full_name': c.user.full_name,
            'email': c.user.email,
            'specialty': c.specialty,
            'assigned_patients': PatientProfile.objects.filter(clinician=c.user).count()
        } for c in clinicians]
        return Response(data)
