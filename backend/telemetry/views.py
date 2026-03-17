import csv
import io
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from patients.models import PatientProfile
from .models import PressureSession, SensorFrame, FrameMetrics


FRAME_ROWS = 32
FRAME_COLS = 32
FRAMES_PER_SECOND = 14
# Minimum cluster size for Peak Pressure Index calculation
PPI_MIN_CLUSTER_PIXELS = 10


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
        }
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

    metrics = FrameMetrics.objects.filter(session=session).order_by('frame_number')

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
