import csv
import io
from datetime import datetime, timedelta
from pathlib import Path

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg
from alerts.models import Alert
from patients.models import PatientProfile
from .models import PressureSession, SensorFrame, FrameMetrics


FRAME_ROWS = 32
FRAME_COLS = 32
FRAMES_PER_SECOND = 14
# Minimum cluster size for Peak Pressure Index calculation
PPI_MIN_CLUSTER_PIXELS = 10

# Alert generation thresholds
MIN_STREAK_SECONDS = 5          # Sustained danger for 5 seconds before alerting
MIN_STREAK_FRAMES = MIN_STREAK_SECONDS * FRAMES_PER_SECOND  # 70 frames
COOLDOWN_SECONDS = 10           # Must be safe for 10 seconds before new alert can trigger
COOLDOWN_FRAMES = COOLDOWN_SECONDS * FRAMES_PER_SECOND       # 140 frames

# Risk score thresholds for alert severity
RISK_LOW_THRESHOLD = 3.0        # risk_score >= 3 starts a danger streak
RISK_MEDIUM_THRESHOLD = 5.0     # risk_score >= 5 → medium severity
RISK_HIGH_THRESHOLD = 7.0       # risk_score >= 7 → high severity

# Temporary toggle for demo/testing. Set to False to restore strict production behavior.
FORCE_ALERT_TEST_MODE = False

# Easier trigger settings used only when FORCE_ALERT_TEST_MODE is enabled.
TEST_RISK_LOW_THRESHOLD = 0.1
TEST_MIN_STREAK_FRAMES = 5
TEST_COOLDOWN_FRAMES = 14


def compute_frame_metrics(frame_data, patient_profile):
    """
    Compute metrics for a single 32x32 frame.
    
    Args:
        frame_data: list of 32 lists, each with 32 int values (1-4095)
        patient_profile: PatientProfile instance with threshold settings
    
    Returns:
        dict with peak_pressure_index, contact_area_percent, average_pressure, risk_score
    """
    flat = [val for row in frame_data for val in row]
    total_pixels = FRAME_ROWS * FRAME_COLS  # 1024

    # Contact area: pixels above baseline (value > 1 means contact)
    active_pixels = [v for v in flat if v > 1]
    contact_area_percent = (len(active_pixels) / total_pixels) * 100

    # Average pressure across active pixels
    average_pressure = sum(active_pixels) / len(active_pixels) if active_pixels else 0.0

    # Peak Pressure Index: highest pressure, but only consider regions
    # with at least PPI_MIN_CLUSTER_PIXELS contiguous pixels above baseline.
    # Simplified: take max of all active pixels if there are enough of them.
    if len(active_pixels) >= PPI_MIN_CLUSTER_PIXELS:
        peak_pressure_index = max(active_pixels)
    else:
        peak_pressure_index = 0.0

    # Risk score (0-10) relative to patient's own thresholds
    pressure_threshold = patient_profile.pressure_threshold
    contact_threshold = patient_profile.contact_area_threshold

    # Pressure component: how far peak exceeds patient's threshold (0-5 points)
    if pressure_threshold > 0 and peak_pressure_index > 0:
        pressure_ratio = peak_pressure_index / pressure_threshold
        pressure_score = min(pressure_ratio - 1, 1) * 5 if pressure_ratio > 1 else 0
    else:
        pressure_score = 0

    # Contact area component: how far contact area exceeds threshold (0-5 points)
    if contact_threshold > 0:
        contact_ratio = contact_area_percent / contact_threshold
        contact_score = min(contact_ratio - 1, 1) * 5 if contact_ratio > 1 else 0
    else:
        contact_score = 0

    risk_score = round(min(pressure_score + contact_score, 10), 2)

    return {
        'peak_pressure_index': round(peak_pressure_index, 2),
        'contact_area_percent': round(contact_area_percent, 2),
        'average_pressure': round(average_pressure, 2),
        'risk_score': risk_score,
    }


def determine_severity(max_risk_in_streak):
    """Map the peak risk score in a streak to alert severity."""
    if max_risk_in_streak >= RISK_HIGH_THRESHOLD:
        return 'high'
    elif max_risk_in_streak >= RISK_MEDIUM_THRESHOLD:
        return 'medium'
    return 'low'


def determine_alert_type(metrics_in_streak, patient_profile):
    """Determine the primary reason for the alert based on what exceeded thresholds most."""
    avg_ppi = sum(m.peak_pressure_index for m in metrics_in_streak) / len(metrics_in_streak)
    avg_contact = sum(m.contact_area_percent for m in metrics_in_streak) / len(metrics_in_streak)

    pressure_exceeded = avg_ppi > patient_profile.pressure_threshold
    contact_exceeded = avg_contact > patient_profile.contact_area_threshold

    if pressure_exceeded and contact_exceeded:
        return 'critical_risk'
    elif pressure_exceeded:
        return 'sustained_pressure'
    elif contact_exceeded:
        return 'high_contact_area'
    return 'elevated_risk'


def check_and_generate_alerts(
    session,
    patient_profile,
    risk_low_threshold=RISK_LOW_THRESHOLD,
    min_streak_frames=MIN_STREAK_FRAMES,
    cooldown_frames=COOLDOWN_FRAMES,
):
    """
    Walk through a session's frame metrics and generate alerts using bouncing logic.
    
        - A "danger streak" starts when risk_score >= risk_low_threshold
        - An alert is created when the streak lasts >= min_streak_frames
        - After an alert, a cooldown of cooldown_frames of safe frames
      must pass before a new alert can trigger
    - Severity is based on the peak risk_score during the streak
    """
    metrics = list(
        FrameMetrics.objects.filter(session=session)
        .select_related('sensor_frame')
        .order_by('frame_number')
    )

    if not metrics:
        return []

    alerts_created = []
    streak_start = None         # Index where current danger streak began
    streak_metrics = []         # Metrics in current streak
    max_risk_in_streak = 0.0
    cooldown_remaining = 0      # Frames remaining in cooldown after an alert

    for i, m in enumerate(metrics):
        # If in cooldown, count down regardless of risk
        if cooldown_remaining > 0:
            cooldown_remaining -= 1
            streak_start = None
            streak_metrics = []
            max_risk_in_streak = 0.0
            continue

        if m.risk_score >= risk_low_threshold:
            # In danger zone
            if streak_start is None:
                streak_start = i
                streak_metrics = []
                max_risk_in_streak = 0.0

            streak_metrics.append(m)
            max_risk_in_streak = max(max_risk_in_streak, m.risk_score)

            streak_length = i - streak_start + 1

            # Check if streak is long enough to trigger an alert
            if streak_length >= min_streak_frames:
                severity = determine_severity(max_risk_in_streak)
                alert_type = determine_alert_type(streak_metrics, patient_profile)
                trigger_frame = metrics[streak_start].sensor_frame

                alert = Alert.objects.create(
                    patient=patient_profile,
                    sensor_frame=trigger_frame,
                    alert_type=alert_type,
                    severity=severity,
                    status='new',
                )
                alerts_created.append({
                    'id': alert.id,
                    'alert_type': alert_type,
                    'severity': severity,
                    'trigger_frame': streak_start,
                    'streak_duration_seconds': round(streak_length / FRAMES_PER_SECOND, 2),
                    'max_risk_score': max_risk_in_streak,
                })

                # Enter cooldown
                cooldown_remaining = cooldown_frames
                streak_start = None
                streak_metrics = []
                max_risk_in_streak = 0.0
        else:
            # Safe zone — reset streak
            streak_start = None
            streak_metrics = []
            max_risk_in_streak = 0.0

    return alerts_created


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_csv(request):
    """
    Upload a CSV file of sensor data for the authenticated patient.
    POST /api/telemetry/upload/
    
    The CSV has no headers. Every 32 consecutive rows form one frame (32x32 matrix).
    Values range from 1-4095. Data is captured at 14 frames per second.
    """
    csv_file = request.FILES.get('file')
    if not csv_file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    if not csv_file.name.endswith('.csv'):
        return Response({'error': 'File must be a CSV'}, status=status.HTTP_400_BAD_REQUEST)

    # Get the patient profile for the authenticated user
    try:
        patient_profile = PatientProfile.objects.get(patient=request.user)
    except PatientProfile.DoesNotExist:
        return Response(
            {'error': 'No patient profile found for this user'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Optional: allow threshold updates in the same multipart upload request.
    pressure_threshold_raw = request.data.get('pressure_threshold')
    contact_area_threshold_raw = request.data.get('contact_area_threshold')
    duration_threshold_raw = request.data.get('duration_threshold')

    if pressure_threshold_raw is not None:
        try:
            pressure_threshold = int(pressure_threshold_raw)
        except (TypeError, ValueError):
            return Response(
                {'error': 'pressure_threshold must be an integer between 1 and 4095'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not 1 <= pressure_threshold <= 4095:
            return Response(
                {'error': 'pressure_threshold must be between 1 and 4095'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        patient_profile.pressure_threshold = pressure_threshold

    if contact_area_threshold_raw is not None:
        try:
            contact_area_threshold = float(contact_area_threshold_raw)
        except (TypeError, ValueError):
            return Response(
                {'error': 'contact_area_threshold must be a number between 0 and 100'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not 0 <= contact_area_threshold <= 100:
            return Response(
                {'error': 'contact_area_threshold must be between 0 and 100'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        patient_profile.contact_area_threshold = contact_area_threshold

    if duration_threshold_raw is not None:
        try:
            duration_threshold = int(duration_threshold_raw)
        except (TypeError, ValueError):
            return Response(
                {'error': 'duration_threshold must be an integer greater than or equal to 0'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if duration_threshold < 0:
            return Response(
                {'error': 'duration_threshold must be greater than or equal to 0'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        patient_profile.duration_threshold = duration_threshold

    if (
        pressure_threshold_raw is not None
        or contact_area_threshold_raw is not None
        or duration_threshold_raw is not None
    ):
        patient_profile.save(update_fields=[
            'pressure_threshold',
            'contact_area_threshold',
            'duration_threshold',
        ])

    # Read and parse CSV
    try:
        decoded = csv_file.read().decode('utf-8')
        reader = csv.reader(io.StringIO(decoded))
        all_rows = []
        for row in reader:
            if row:  # skip empty rows
                all_rows.append([int(val.strip()) for val in row if val.strip()])
    except Exception as e:
        return Response({'error': f'Failed to parse CSV: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate: rows must be divisible by 32
    if len(all_rows) % FRAME_ROWS != 0:
        return Response(
            {'error': f'CSV has {len(all_rows)} rows, which is not divisible by {FRAME_ROWS}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    total_frames = len(all_rows) // FRAME_ROWS
    duration_seconds = total_frames / FRAMES_PER_SECOND
    session_date = timezone.now()

    # Create the session
    session = PressureSession.objects.create(
        patient=patient_profile,
        session_date=session_date,
        duration_seconds=duration_seconds,
        total_frames=total_frames,
        filename=csv_file.name,
    )

    # Process frames in chunks of 32 rows
    sensor_frames = []
    frame_metrics_list = []
    metric_sums = {'ppi': 0, 'contact': 0, 'avg_p': 0, 'risk': 0}

    for i in range(total_frames):
        start_row = i * FRAME_ROWS
        frame_data = all_rows[start_row:start_row + FRAME_ROWS]

        # Validate each row has 32 columns
        for row in frame_data:
            if len(row) != FRAME_COLS:
                session.delete()
                return Response(
                    {'error': f'Frame {i}: expected {FRAME_COLS} columns, got {len(row)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Timestamp for this frame based on position
        frame_timestamp = session_date + timedelta(seconds=i / FRAMES_PER_SECOND)

        # Create SensorFrame
        sf = SensorFrame(
            patient=patient_profile,
            session=session,
            frame_number=i,
            timestamp=frame_timestamp,
            data=frame_data,
        )
        sensor_frames.append(sf)

        # Compute metrics
        metrics = compute_frame_metrics(frame_data, patient_profile)
        metric_sums['ppi'] += metrics['peak_pressure_index']
        metric_sums['contact'] += metrics['contact_area_percent']
        metric_sums['avg_p'] += metrics['average_pressure']
        metric_sums['risk'] += metrics['risk_score']

    # Bulk create sensor frames
    SensorFrame.objects.bulk_create(sensor_frames, batch_size=500)

    # Now create FrameMetrics (need the saved SensorFrame PKs)
    saved_frames = SensorFrame.objects.filter(session=session).order_by('frame_number')

    for sf in saved_frames:
        frame_data = sf.data
        metrics = compute_frame_metrics(frame_data, patient_profile)
        frame_metrics_list.append(FrameMetrics(
            sensor_frame=sf,
            session=session,
            frame_number=sf.frame_number,
            timestamp=sf.timestamp,
            peak_pressure_index=metrics['peak_pressure_index'],
            contact_area_percent=metrics['contact_area_percent'],
            average_pressure=metrics['average_pressure'],
            risk_score=metrics['risk_score'],
        ))

    FrameMetrics.objects.bulk_create(frame_metrics_list, batch_size=500)

    # Update session with averages
    if total_frames > 0:
        session.avg_peak_pressure = round(metric_sums['ppi'] / total_frames, 2)
        session.avg_contact_area = round(metric_sums['contact'] / total_frames, 2)
        session.avg_pressure = round(metric_sums['avg_p'] / total_frames, 2)
        session.avg_risk_score = round(metric_sums['risk'] / total_frames, 2)
        session.save()

    # Auto-generate alerts based on bouncing threshold logic.
    if FORCE_ALERT_TEST_MODE:
        alerts_generated = check_and_generate_alerts(
            session,
            patient_profile,
            risk_low_threshold=TEST_RISK_LOW_THRESHOLD,
            min_streak_frames=TEST_MIN_STREAK_FRAMES,
            cooldown_frames=TEST_COOLDOWN_FRAMES,
        )
    else:
        alerts_generated = check_and_generate_alerts(session, patient_profile)

    return Response({
        'message': 'CSV uploaded and processed successfully',
        'session_id': session.id,
        'total_frames': total_frames,
        'duration_seconds': round(duration_seconds, 2),
        'averages': {
            'peak_pressure': session.avg_peak_pressure,
            'contact_area': session.avg_contact_area,
            'average_pressure': session.avg_pressure,
            'risk_score': session.avg_risk_score,
        },
        'alerts_generated': alerts_generated,
        'alert_test_mode': FORCE_ALERT_TEST_MODE,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    """
    List pressure sessions for a patient.
    GET /api/telemetry/sessions/?patient_id=X
    If no patient_id provided, returns sessions for the authenticated user.
    """
    patient_id = request.query_params.get('patient_id')

    if patient_id:
        sessions = PressureSession.objects.filter(patient_id=patient_id)
    else:
        try:
            profile = PatientProfile.objects.get(patient=request.user)
            sessions = PressureSession.objects.filter(patient=profile)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'No patient profile found'}, status=status.HTTP_404_NOT_FOUND)

    data = []
    for s in sessions:
        data.append({
            'id': s.id,
            'session_date': s.session_date,
            'duration_seconds': s.duration_seconds,
            'total_frames': s.total_frames,
            'filename': s.filename,
            'averages': {
                'peak_pressure': s.avg_peak_pressure,
                'contact_area': s.avg_contact_area,
                'average_pressure': s.avg_pressure,
                'risk_score': s.avg_risk_score,
            }
        })

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_metrics(request, session_id):
    """
    Get metrics timeline for a session (for graphs).
    GET /api/telemetry/sessions/<session_id>/metrics/
    """
    try:
        session = PressureSession.objects.get(id=session_id)
    except PressureSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    metrics = FrameMetrics.objects.filter(session=session)

    period = request.query_params.get('period')
    start_date_param = request.query_params.get('start_date')
    end_date_param = request.query_params.get('end_date')

    # Explicit date range filtering (ISO datetime strings)
    if start_date_param or end_date_param:
        try:
            start_dt = None
            end_dt = None

            if start_date_param:
                start_dt = datetime.fromisoformat(start_date_param.replace('Z', '+00:00'))
                if timezone.is_naive(start_dt):
                    start_dt = timezone.make_aware(start_dt, timezone.get_current_timezone())

            if end_date_param:
                end_dt = datetime.fromisoformat(end_date_param.replace('Z', '+00:00'))
                if timezone.is_naive(end_dt):
                    end_dt = timezone.make_aware(end_dt, timezone.get_current_timezone())

            if start_dt:
                metrics = metrics.filter(timestamp__gte=start_dt)
            if end_dt:
                metrics = metrics.filter(timestamp__lte=end_dt)

        except ValueError:
            return Response(
                {'error': 'Invalid start_date/end_date. Use ISO datetime format.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Relative period filtering anchored at latest frame timestamp in the session
    elif period in {'1h', '6h', '24h'}:
        latest_ts = metrics.order_by('-timestamp').values_list('timestamp', flat=True).first()
        if latest_ts:
            hours = int(period.replace('h', ''))
            cutoff = latest_ts - timedelta(hours=hours)
            metrics = metrics.filter(timestamp__gte=cutoff)

    metrics = metrics.order_by('frame_number')

    data = {
        'session_id': session.id,
        'total_frames': session.total_frames,
        'duration_seconds': session.duration_seconds,
        'averages': {
            'peak_pressure': session.avg_peak_pressure,
            'contact_area': session.avg_contact_area,
            'average_pressure': session.avg_pressure,
            'risk_score': session.avg_risk_score,
        },
        'timeline': [
            {
                'frame_number': m.frame_number,
                'timestamp': m.timestamp,
                'peak_pressure_index': m.peak_pressure_index,
                'contact_area_percent': m.contact_area_percent,
                'average_pressure': m.average_pressure,
                'risk_score': m.risk_score,
            }
            for m in metrics
        ]
    }

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_frames(request, session_id):
    """
    Get raw frames for heat map playback (batch fetch by range).
    GET /api/telemetry/sessions/<session_id>/frames/?start=0&end=140
    
    Returns frames between start and end frame numbers (inclusive).
    Default: first 140 frames (~10 seconds at 14fps).
    """
    try:
        session = PressureSession.objects.get(id=session_id)
    except PressureSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    start = int(request.query_params.get('start', 0))
    end = int(request.query_params.get('end', start + 139))

    frames = SensorFrame.objects.filter(
        session=session,
        frame_number__gte=start,
        frame_number__lte=end,
    ).order_by('frame_number')

    data = {
        'session_id': session.id,
        'start': start,
        'end': end,
        'total_session_frames': session.total_frames,
        'frames': [
            {
                'frame_number': f.frame_number,
                'timestamp': f.timestamp,
                'data': f.data,
            }
            for f in frames
        ]
    }

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_heatmap(request, session_id):
    """
    Get aggregated 32x32 session heatmap.
    GET /api/telemetry/sessions/<session_id>/heatmap/

    Returns per-cell average pressure across all frames in the session,
    computed server-side to avoid large payloads and frontend crashes.
    """
    try:
        session = PressureSession.objects.get(id=session_id)
    except PressureSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    frames = SensorFrame.objects.filter(session=session).only('data').order_by('frame_number')
    frame_count = frames.count()

    if frame_count == 0:
        return Response(
            {
                'session_id': session.id,
                'frame_count': 0,
                'max_value': 0,
                'heatmap': [[0 for _ in range(FRAME_COLS)] for _ in range(FRAME_ROWS)],
            },
            status=status.HTTP_200_OK,
        )

    sums = [[0.0 for _ in range(FRAME_COLS)] for _ in range(FRAME_ROWS)]

    for frame in frames.iterator(chunk_size=100):
        data = frame.data
        for r in range(FRAME_ROWS):
            for c in range(FRAME_COLS):
                sums[r][c] += data[r][c]

    heatmap = [[round(sums[r][c] / frame_count, 2) for c in range(FRAME_COLS)] for r in range(FRAME_ROWS)]
    max_value = max(max(row) for row in heatmap)

    return Response(
        {
            'session_id': session.id,
            'frame_count': frame_count,
            'max_value': max_value,
            'heatmap': heatmap,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_telemetry(request):
    """
    Reset telemetry storage for fresh ingestion.
    POST /api/telemetry/reset/

    Admin-only endpoint that removes:
    - All PressureSession rows (cascades to SensorFrame/FrameMetrics)
    - All CSV files under backend/csv and top-level csv folders
    """
    if getattr(request.user, 'role', None) != 'admin':
        return Response({'error': 'Only admins can reset telemetry data'}, status=status.HTTP_403_FORBIDDEN)

    deleted_rows, _ = PressureSession.objects.all().delete()

    project_root = Path(__file__).resolve().parents[2]
    csv_dirs = [project_root / 'csv', project_root.parent / 'csv']

    removed_files = 0
    for folder in csv_dirs:
        if not folder.exists() or not folder.is_dir():
            continue
        for csv_file in folder.glob('*.csv'):
            csv_file.unlink(missing_ok=True)
            removed_files += 1

    return Response(
        {
            'message': 'Telemetry data reset complete',
            'deleted_rows': deleted_rows,
            'deleted_csv_files': removed_files,
        },
        status=status.HTTP_200_OK,
    )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_report(request):
    """
    Generate a report comparing today's sessions to yesterday's.
    GET /api/telemetry/report/?patient_id=X&date=2026-03-25
    If no date provided, uses today.
    """
    patient_id = request.query_params.get('patient_id')
    date_str = request.query_params.get('date')

    # Resolve patient
    if patient_id:
        try:
            patient_profile = PatientProfile.objects.get(pk=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        try:
            patient_profile = PatientProfile.objects.get(patient=request.user)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'No patient profile found'}, status=status.HTTP_404_NOT_FOUND)

    # Resolve target date
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format, use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        target_date = timezone.now().date()

    yesterday = target_date - timedelta(days=1)

    # If two specific sessions are requested, compare those directly
    session_a_id = request.query_params.get('session_a')
    session_b_id = request.query_params.get('session_b')

    if session_a_id and session_b_id:
        try:
            session_a = PressureSession.objects.get(id=session_a_id)
            session_b = PressureSession.objects.get(id=session_b_id)
        except PressureSession.DoesNotExist:
            return Response({'error': 'One or both sessions not found'}, status=status.HTTP_404_NOT_FOUND)

        def session_to_dict(s):
            return {
                'id': s.id,
                'filename': s.filename,
                'session_date': s.session_date,
                'duration_seconds': s.duration_seconds,
                'avg_risk_score': s.avg_risk_score,
                'avg_peak_pressure': s.avg_peak_pressure,
                'avg_contact_area': s.avg_contact_area,
                'avg_pressure': s.avg_pressure,
            }

        def delta(a_val, b_val):
            a_val = a_val or 0
            b_val = b_val or 0
            diff = round(a_val - b_val, 2)
            pct = round((diff / b_val) * 100, 1) if b_val != 0 else None
            return {'diff': diff, 'percent_change': pct, 'direction': 'up' if diff > 0 else 'down' if diff < 0 else 'same'}

        comparison = {
            'risk_score': delta(session_a.avg_risk_score, session_b.avg_risk_score),
            'peak_pressure': delta(session_a.avg_peak_pressure, session_b.avg_peak_pressure),
            'contact_area': delta(session_a.avg_contact_area, session_b.avg_contact_area),
            'avg_pressure': delta(session_a.avg_pressure, session_b.avg_pressure),
        }

        return Response({
            'patient_id': patient_profile.pk,
            'session_a': session_to_dict(session_a),
            'session_b': session_to_dict(session_b),
            'comparison': comparison,
        }, status=status.HTTP_200_OK)

    def get_day_stats(date):
        sessions = PressureSession.objects.filter(
            patient=patient_profile,
            session_date__date=date
        )
        if not sessions.exists():
            return None

        aggregated = sessions.aggregate(
            avg_risk=Avg('avg_risk_score'),
            avg_peak=Avg('avg_peak_pressure'),
            avg_contact=Avg('avg_contact_area'),
            avg_pressure=Avg('avg_pressure'),
        )

        return {
            'date': str(date),
            'session_count': sessions.count(),
            'total_duration_seconds': sum(s.duration_seconds or 0 for s in sessions),
            'avg_risk_score': round(aggregated['avg_risk'] or 0, 2),
            'avg_peak_pressure': round(aggregated['avg_peak'] or 0, 2),
            'avg_contact_area': round(aggregated['avg_contact'] or 0, 2),
            'avg_pressure': round(aggregated['avg_pressure'] or 0, 2),
            'sessions': [
                {
                    'id': s.id,
                    'filename': s.filename,
                    'session_date': s.session_date,
                    'duration_seconds': s.duration_seconds,
                    'avg_risk_score': s.avg_risk_score,
                    'avg_peak_pressure': s.avg_peak_pressure,
                    'avg_contact_area': s.avg_contact_area,
                    'avg_pressure': s.avg_pressure,
                }
                for s in sessions.order_by('session_date')
            ]
        }

    today_stats = get_day_stats(target_date)
    yesterday_stats = get_day_stats(yesterday)

    # Build comparison if both days have data
    comparison = None
    if today_stats and yesterday_stats:
        def delta(today_val, yesterday_val):
            diff = round(today_val - yesterday_val, 2)
            pct = round((diff / yesterday_val) * 100, 1) if yesterday_val != 0 else None
            return {'diff': diff, 'percent_change': pct, 'direction': 'up' if diff > 0 else 'down' if diff < 0 else 'same'}

        comparison = {
            'risk_score': delta(today_stats['avg_risk_score'], yesterday_stats['avg_risk_score']),
            'peak_pressure': delta(today_stats['avg_peak_pressure'], yesterday_stats['avg_peak_pressure']),
            'contact_area': delta(today_stats['avg_contact_area'], yesterday_stats['avg_contact_area']),
            'avg_pressure': delta(today_stats['avg_pressure'], yesterday_stats['avg_pressure']),
        }

    return Response({
        'patient_id': patient_profile.pk,
        'report_date': str(target_date),
        'today': today_stats,
        'yesterday': yesterday_stats,
        'comparison': comparison,
    }, status=status.HTTP_200_OK)


