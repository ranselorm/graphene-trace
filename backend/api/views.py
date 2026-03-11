from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from accounts.models import User
from patients.models import PatientProfile
from clinicians.models import Clinician
from alerts.models import Alert
from telemetry.models import SensorFrame
from comments.models import Comment
from django.utils import timezone
from datetime import timedelta


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard overview statistics
    GET /api/dashboard/stats/
    """
    # Count users by role
    total_users = User.objects.count()
    total_patients = User.objects.filter(role='patient').count()
    total_clinicians = User.objects.filter(role='clinician').count()
    total_admins = User.objects.filter(role='admin').count()
    
    # Count alerts by severity
    high_severity_alerts = Alert.objects.filter(severity='high').count()
    medium_severity_alerts = Alert.objects.filter(severity='medium').count()
    low_severity_alerts = Alert.objects.filter(severity='low').count()
    
    # Count alerts by status
    new_alerts = Alert.objects.filter(status='new').count()
    reviewed_alerts = Alert.objects.filter(status='reviewed').count()
    resolved_alerts = Alert.objects.filter(status='resolved').count()
    
    # Assignment coverage
    assigned_patients = PatientProfile.objects.filter(clinician__isnull=False).count()
    unassigned_patients = PatientProfile.objects.filter(clinician__isnull=True).count()
    
    # Recent activity (last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    recent_alerts = Alert.objects.filter(created_at__gte=week_ago).count()
    recent_sensor_data = SensorFrame.objects.filter(created_at__gte=week_ago).count()
    
    # Comments statistics
    total_comments = Comment.objects.count()
    recent_comments = Comment.objects.filter(created_at__gte=week_ago).count()
    
    return Response({
        'users': {
            'total': total_users,
            'patients': total_patients,
            'clinicians': total_clinicians,
            'admins': total_admins
        },
        'alerts': {
            'by_severity': {
                'high': high_severity_alerts,
                'medium': medium_severity_alerts,
                'low': low_severity_alerts,
                'total': high_severity_alerts + medium_severity_alerts + low_severity_alerts
            },
            'by_status': {
                'new': new_alerts,
                'reviewed': reviewed_alerts,
                'resolved': resolved_alerts,
                'total': new_alerts + reviewed_alerts + resolved_alerts
            }
        },
        'assignments': {
            'assigned': assigned_patients,
            'unassigned': unassigned_patients,
            'total': assigned_patients + unassigned_patients
        },
        'recent_activity': {
            'alerts_last_7_days': recent_alerts,
            'sensor_data_last_7_days': recent_sensor_data,
            'comments_last_7_days': recent_comments
        },
        'comments': {
            'total': total_comments,
            'recent': recent_comments
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alerts_trend(request):
    """
    Get alerts trend data for charts (last 7 days)
    GET /api/dashboard/alerts-trend/
    """
    days = []
    alert_counts = []
    
    for i in range(6, -1, -1):
        day = timezone.now() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        count = Alert.objects.filter(
            created_at__gte=day_start,
            created_at__lte=day_end
        ).count()
        
        days.append(day.strftime('%a'))  # Mon, Tue, Wed, etc.
        alert_counts.append(count)
    
    return Response({
        'labels': days,
        'data': alert_counts
    }, status=status.HTTP_200_OK)
