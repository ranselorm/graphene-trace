"""
Seed telemetry sessions, frames, and metrics for local development.

Run:
  cd backend
  python manage.py shell < seed_telemetry.py
"""

import math
import random
from datetime import timedelta

from django.apps import apps
from django.db import transaction
from django.utils import timezone

from telemetry.views import (
    FRAME_COLS,
    FRAME_ROWS,
    FRAMES_PER_SECOND,
    compute_frame_metrics,
)


User = apps.get_model("accounts", "User")
PatientProfile = apps.get_model("patients", "PatientProfile")
PressureSession = apps.get_model("telemetry", "PressureSession")
SensorFrame = apps.get_model("telemetry", "SensorFrame")
FrameMetrics = apps.get_model("telemetry", "FrameMetrics")

SEED_PASSWORD = "patient123"
RANDOM_SEED = 20260323
PATIENT_COUNT = 3
SESSIONS_PER_PATIENT = 3
FRAMES_PER_SESSION = 140  # ~10 seconds at 14 fps
FILENAME_PREFIX = "seed_telemetry"


random.seed(RANDOM_SEED)


def get_or_create_patient(index: int):
    username = f"telemetry_patient_{index}"
    email = f"{username}@example.com"
    full_name = f"Telemetry Patient {index}"

    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "username": username,
            "full_name": full_name,
            "role": "patient",
            "is_active": True,
        },
    )

    user.username = username
    user.full_name = full_name
    user.role = "patient"
    user.is_active = True
    user.set_password(SEED_PASSWORD)
    user.save()

    profile, _ = PatientProfile.objects.get_or_create(patient=user)
    profile.pressure_threshold = 1800 + (index * 150)
    profile.contact_area_threshold = 40 + (index * 5)
    profile.duration_threshold = 300
    profile.save()

    return user, profile


def make_frame(frame_number: int, total_frames: int, intensity_shift: int):
    # Simulate a moving high-pressure hotspot plus light background noise.
    progress = frame_number / max(total_frames - 1, 1)
    center_x = 8 + (progress * 16)
    center_y = 16 + (6 * math.sin(progress * 2 * math.pi))

    frame = []
    for r in range(FRAME_ROWS):
        row = []
        for c in range(FRAME_COLS):
            dx = c - center_x
            dy = r - center_y
            distance_sq = (dx * dx) + (dy * dy)

            hotspot = (2200 + intensity_shift) * math.exp(-distance_sq / 18)
            baseline = random.randint(1, 5)
            noise = random.randint(-35, 35)

            value = int(round(baseline + hotspot + noise))
            value = max(1, min(4095, value))
            row.append(value)
        frame.append(row)

    return frame


def seed_one_session(profile, session_time, filename, frame_count, intensity_shift):
    duration_seconds = frame_count / FRAMES_PER_SECOND

    with transaction.atomic():
        session = PressureSession.objects.create(
            patient=profile,
            session_date=session_time,
            duration_seconds=duration_seconds,
            total_frames=frame_count,
            filename=filename,
        )

        metric_sum_peak = 0.0
        metric_sum_contact = 0.0
        metric_sum_avg_pressure = 0.0
        metric_sum_risk = 0.0

        for frame_number in range(frame_count):
            frame_timestamp = session_time + timedelta(seconds=frame_number / FRAMES_PER_SECOND)
            frame_data = make_frame(frame_number, frame_count, intensity_shift)

            sensor_frame = SensorFrame.objects.create(
                patient=profile,
                session=session,
                frame_number=frame_number,
                timestamp=frame_timestamp,
                data=frame_data,
            )

            metrics = compute_frame_metrics(frame_data, profile)
            FrameMetrics.objects.create(
                sensor_frame=sensor_frame,
                session=session,
                frame_number=frame_number,
                timestamp=frame_timestamp,
                peak_pressure_index=metrics["peak_pressure_index"],
                contact_area_percent=metrics["contact_area_percent"],
                average_pressure=metrics["average_pressure"],
                risk_score=metrics["risk_score"],
            )

            metric_sum_peak += metrics["peak_pressure_index"]
            metric_sum_contact += metrics["contact_area_percent"]
            metric_sum_avg_pressure += metrics["average_pressure"]
            metric_sum_risk += metrics["risk_score"]

        session.avg_peak_pressure = round(metric_sum_peak / frame_count, 2)
        session.avg_contact_area = round(metric_sum_contact / frame_count, 2)
        session.avg_pressure = round(metric_sum_avg_pressure / frame_count, 2)
        session.avg_risk_score = round(metric_sum_risk / frame_count, 2)
        session.save()

    return session


def main():
    deleted, _ = PressureSession.objects.filter(filename__startswith=FILENAME_PREFIX).delete()
    if deleted:
        print(f"Deleted previous seeded telemetry rows: {deleted}")

    created_sessions = []
    now = timezone.now()

    for patient_index in range(1, PATIENT_COUNT + 1):
        user, profile = get_or_create_patient(patient_index)

        for session_index in range(1, SESSIONS_PER_PATIENT + 1):
            session_time = now - timedelta(days=session_index, minutes=(patient_index * 7))
            filename = f"{FILENAME_PREFIX}_p{patient_index}_s{session_index}.csv"
            intensity_shift = (patient_index * 150) + (session_index * 80)

            session = seed_one_session(
                profile=profile,
                session_time=session_time,
                filename=filename,
                frame_count=FRAMES_PER_SESSION,
                intensity_shift=intensity_shift,
            )
            created_sessions.append((user.email, session.id, session.total_frames))

    print("Telemetry seeding complete.")
    print(f"Created sessions: {len(created_sessions)}")
    print(f"Frames per session: {FRAMES_PER_SESSION}")
    print(f"Total seeded frames: {len(created_sessions) * FRAMES_PER_SESSION}")
    print(f"Seeded patient password: {SEED_PASSWORD}")
    print("Session IDs:")
    for email, session_id, total_frames in created_sessions:
        print(f"  {email} -> session_id={session_id}, frames={total_frames}")


main()
