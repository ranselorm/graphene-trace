from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Alert
from .serializers import AlertSerializer


class AlertViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Alert operations
    
    Provides:
    - GET /api/alerts/ - List all alerts
    - POST /api/alerts/ - Create new alert
    - GET /api/alerts/{id}/ - Get single alert
    - PUT /api/alerts/{id}/ - Update alert
    - PATCH /api/alerts/{id}/ - Partial update
    - DELETE /api/alerts/{id}/ - Delete alert
    
    Plus custom actions for filtering and status updates
    """
    queryset = Alert.objects.all().select_related('patient__patient', 'sensor_frame')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter alerts based on query parameters
        Examples:
        - /api/alerts/?severity=high
        - /api/alerts/?status=new
        - /api/alerts/?patient=5
        """
        queryset = super().get_queryset()
        
        # Filter by severity
        severity = self.request.query_params.get('severity', None)
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by alert type
        alert_type = self.request.query_params.get('alert_type', None)
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get latest alerts
        GET /api/alerts/latest/?limit=10
        """
        limit = int(request.query_params.get('limit', 10))
        alerts = self.get_queryset()[:limit]
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_severity(self, request):
        """
        Get count of alerts grouped by severity
        GET /api/alerts/by_severity/
        Returns: {"high": 5, "medium": 12, "low": 8, "total": 25}
        """
        high = self.get_queryset().filter(severity='high').count()
        medium = self.get_queryset().filter(severity='medium').count()
        low = self.get_queryset().filter(severity='low').count()
        
        return Response({
            'high': high,
            'medium': medium,
            'low': low,
            'total': high + medium + low
        })
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """
        Get count of alerts grouped by status
        GET /api/alerts/by_status/
        Returns: {"new": 10, "reviewed": 8, "resolved": 7, "total": 25}
        """
        new = self.get_queryset().filter(status='new').count()
        reviewed = self.get_queryset().filter(status='reviewed').count()
        resolved = self.get_queryset().filter(status='resolved').count()
        
        return Response({
            'new': new,
            'reviewed': reviewed,
            'resolved': resolved,
            'total': new + reviewed + resolved
        })
    
    @action(detail=True, methods=['patch'])
    def mark_reviewed(self, request, pk=None):
        """
        Mark an alert as reviewed
        PATCH /api/alerts/{id}/mark_reviewed/
        """
        alert = self.get_object()
        alert.status = 'reviewed'
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def mark_resolved(self, request, pk=None):
        """
        Mark an alert as resolved
        PATCH /api/alerts/{id}/mark_resolved/
        """
        alert = self.get_object()
        alert.status = 'resolved'
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
