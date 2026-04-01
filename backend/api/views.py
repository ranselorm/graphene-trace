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
from telemetry.models import PressureSession
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
    user = request.user
    now = timezone.now()
    week_ago = now - timedelta(days=7)

    def day_bounds(day_dt):
        start = day_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start, end

    patient_profiles_qs = PatientProfile.objects.all()
    alerts_qs = Alert.objects.all()
    comments_qs = Comment.objects.all()
    sessions_qs = PressureSession.objects.all()
    sensor_qs = SensorFrame.objects.all()

    # Scope data for clinician and patient dashboards while keeping admin global.
    if getattr(user, 'role', None) == 'clinician':
        patient_profiles_qs = patient_profiles_qs.filter(clinician=user)
        alerts_qs = alerts_qs.filter(patient__clinician=user)
        comments_qs = comments_qs.filter(sensor_frame__patient__clinician=user)
        sessions_qs = sessions_qs.filter(patient__clinician=user)
        sensor_qs = sensor_qs.filter(patient__clinician=user)
    elif getattr(user, 'role', None) == 'patient':
        patient_profiles_qs = patient_profiles_qs.filter(patient=user)
        alerts_qs = alerts_qs.filter(patient__patient=user)
        comments_qs = comments_qs.filter(sensor_frame__patient__patient=user)
        sessions_qs = sessions_qs.filter(patient__patient=user)
        sensor_qs = sensor_qs.filter(patient__patient=user)

    # Count users by role (always global for admin dashboard widgets)
    total_users = User.objects.count()
    total_patients = User.objects.filter(role='patient').count()
    total_clinicians = User.objects.filter(role='clinician').count()
    total_admins = User.objects.filter(role='admin').count()

    # Count alerts by severity/status within scoped queryset
    high_severity_alerts = alerts_qs.filter(severity='high').count()
    medium_severity_alerts = alerts_qs.filter(severity='medium').count()
    low_severity_alerts = alerts_qs.filter(severity='low').count()

    new_alerts = alerts_qs.filter(status='new').count()
    reviewed_alerts = alerts_qs.filter(status='reviewed').count()
    resolved_alerts = alerts_qs.filter(status='resolved').count()

    # Assignment coverage for scoped queryset
    if getattr(user, 'role', None) == 'admin':
        assigned_patients = PatientProfile.objects.filter(clinician__isnull=False).count()
        unassigned_patients = PatientProfile.objects.filter(clinician__isnull=True).count()
    else:
        assigned_patients = patient_profiles_qs.count()
        unassigned_patients = 0

    # Recent activity (last 7 days)
    recent_alerts = alerts_qs.filter(created_at__gte=week_ago).count()
    recent_sensor_data = sensor_qs.filter(created_at__gte=week_ago).count()

    # Comments statistics
    total_comments = comments_qs.count()
    recent_comments = comments_qs.filter(created_at__gte=week_ago).count()
    pending_patient_comments = comments_qs.filter(user__role='patient').count()

    # Trend helpers
    alerts_trend_7d = []
    comments_trend_7d = []
    reports_trend_7d = []

    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start, day_end = day_bounds(day)
        label = day.strftime('%a')

        alerts_trend_7d.append({
            'day': label,
            'count': alerts_qs.filter(created_at__gte=day_start, created_at__lte=day_end).count(),
        })
        comments_trend_7d.append({
            'day': label,
            'count': comments_qs.filter(created_at__gte=day_start, created_at__lte=day_end, user__role='patient').count(),
        })
        reports_trend_7d.append({
            'day': label,
            'count': sessions_qs.filter(session_date__gte=day_start, session_date__lte=day_end).count(),
        })

    alerts_trend_1m = []
    for week_idx in range(3, -1, -1):
        end = now - timedelta(days=week_idx * 7)
        start = end - timedelta(days=6)
        alerts_trend_1m.append({
            'day': f"W{4 - week_idx}",
            'count': alerts_qs.filter(created_at__gte=start, created_at__lte=end).count(),
        })

    reports_generated_total = sessions_qs.count()

    # Clinician workload (admin global view)
    clinician_workload = []
    clinicians = User.objects.filter(role='clinician').order_by('-id')
    for clinician in clinicians:
        open_alerts_count = Alert.objects.filter(
            patient__clinician=clinician,
            status__in=['new', 'reviewed']
        ).count()
        clinician_workload.append({
            'clinician_name': clinician.full_name or clinician.username,
            'clinician_id': clinician.id,
            'open_alerts': open_alerts_count
        })
    
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
            'recent': recent_comments,
            'pending_patient_comments': pending_patient_comments,
            'trend_7d': comments_trend_7d,
        },
        'reports': {
            'generated': reports_generated_total,
            'generated_trend_7d': reports_trend_7d,
        },
        'trends': {
            'alerts_7d': alerts_trend_7d,
            'alerts_1m': alerts_trend_1m,
        },
        'clinician_workload': clinician_workload
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
