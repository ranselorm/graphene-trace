"""
Import real telemetry CSV files and map them to patient users.

Expected file naming pattern in ../csv:
  <patient_key>_<YYYYMMDD>.csv

Example:
  d13043b3_20251011.csv

Run:
  cd backend
  python manage.py shell < seed_telemetry_from_csv.py
"""

import csv
from datetime import datetime, timedelta
from pathlib import Path

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

CSV_DIR = Path.cwd().parent / "csv"
SEED_PASSWORD = "patient123"
FILENAME_PREFIX = "realcsv_"


def parse_filename_parts(path: Path):
    stem = path.stem
    parts = stem.split("_")
    if len(parts) != 2:
        return None

    patient_key, date_part = parts
    try:
        datetime.strptime(date_part, "%Y%m%d")
    except ValueError:
        return None

    return patient_key, date_part


def get_or_create_patient(patient_key: str, index: int):
    username = f"patient_{patient_key}"
    email = f"{patient_key}@example.com"
    full_name = f"Patient {index} ({patient_key})"

    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "username": username,
            "full_name": full_name,
            "role": "patient",
            "is_active": True,
        },
    )

    user.username = username[:150]
    user.full_name = full_name
    user.role = "patient"
    user.is_active = True
    user.set_password(SEED_PASSWORD)
    user.save()

    profile, _ = PatientProfile.objects.get_or_create(patient=user)
    # Keep thresholds deterministic but varied by patient index.
    profile.pressure_threshold = 1800 + (index * 120)
    profile.contact_area_threshold = 40 + (index * 4)
    profile.duration_threshold = 300
    profile.save()

    return user, profile


def read_csv_frames(file_path: Path):
    all_rows = []

    with file_path.open("r", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not row:
                continue

            values = [v.strip() for v in row if v.strip()]
            if not values:
                continue

            parsed = [int(v) for v in values]
            all_rows.append(parsed)

    if len(all_rows) % FRAME_ROWS != 0:
        raise ValueError(
            f"{file_path.name}: row count {len(all_rows)} is not divisible by {FRAME_ROWS}"
        )

    total_frames = len(all_rows) // FRAME_ROWS
    frames = []

    for frame_number in range(total_frames):
        start = frame_number * FRAME_ROWS
        frame_data = all_rows[start : start + FRAME_ROWS]

        for row in frame_data:
            if len(row) != FRAME_COLS:
                raise ValueError(
                    f"{file_path.name}: frame {frame_number} has row with {len(row)} columns"
                )

        frames.append(frame_data)

    return frames


def make_session_datetime(date_part: str, session_index: int):
    base_date = datetime.strptime(date_part, "%Y%m%d")
    naive_dt = datetime(
        year=base_date.year,
        month=base_date.month,
        day=base_date.day,
        hour=9 + session_index,
        minute=0,
        second=0,
    )
    return timezone.make_aware(naive_dt)


def import_one_session(profile, csv_path: Path, session_date):
    frames = read_csv_frames(csv_path)
    total_frames = len(frames)
    duration_seconds = total_frames / FRAMES_PER_SECOND

    session_filename = f"{FILENAME_PREFIX}{csv_path.name}"

    # Make reruns idempotent for this specific source file.
    PressureSession.objects.filter(
        patient=profile,
        filename=session_filename,
    ).delete()

    with transaction.atomic():
        session = PressureSession.objects.create(
            patient=profile,
            session_date=session_date,
            duration_seconds=duration_seconds,
            total_frames=total_frames,
            filename=session_filename,
        )

        sensor_frames = []
        metrics_by_frame = []

        sum_peak = 0.0
        sum_contact = 0.0
        sum_avg_pressure = 0.0
        sum_risk = 0.0

        for frame_number, frame_data in enumerate(frames):
            frame_timestamp = session_date + timedelta(seconds=frame_number / FRAMES_PER_SECOND)

            sensor_frames.append(
                SensorFrame(
                    patient=profile,
                    session=session,
                    frame_number=frame_number,
                    timestamp=frame_timestamp,
                    data=frame_data,
                )
            )

            metrics = compute_frame_metrics(frame_data, profile)
            metrics_by_frame.append((frame_number, frame_timestamp, metrics))

            sum_peak += metrics["peak_pressure_index"]
            sum_contact += metrics["contact_area_percent"]
            sum_avg_pressure += metrics["average_pressure"]
            sum_risk += metrics["risk_score"]

        SensorFrame.objects.bulk_create(sensor_frames, batch_size=500)

        saved_frames = list(
            SensorFrame.objects.filter(session=session).order_by("frame_number")
        )

        frame_metrics = []
        for sf, (_, ts, metrics) in zip(saved_frames, metrics_by_frame):
            frame_metrics.append(
                FrameMetrics(
                    sensor_frame=sf,
                    session=session,
                    frame_number=sf.frame_number,
                    timestamp=ts,
                    peak_pressure_index=metrics["peak_pressure_index"],
                    contact_area_percent=metrics["contact_area_percent"],
                    average_pressure=metrics["average_pressure"],
                    risk_score=metrics["risk_score"],
                )
            )

        FrameMetrics.objects.bulk_create(frame_metrics, batch_size=500)

        session.avg_peak_pressure = round(sum_peak / total_frames, 2) if total_frames else 0
        session.avg_contact_area = round(sum_contact / total_frames, 2) if total_frames else 0
        session.avg_pressure = round(sum_avg_pressure / total_frames, 2) if total_frames else 0
        session.avg_risk_score = round(sum_risk / total_frames, 2) if total_frames else 0
        session.save()

    return session, total_frames


def main():
    if not CSV_DIR.exists():
        raise FileNotFoundError(f"CSV directory not found: {CSV_DIR}")

    all_csv = sorted(CSV_DIR.glob("*.csv"))
    parsed = []

    for path in all_csv:
        parts = parse_filename_parts(path)
        if parts is None:
            continue
        patient_key, date_part = parts
        parsed.append((patient_key, date_part, path))

    if not parsed:
        print("No valid CSV files found with pattern <patient_key>_<YYYYMMDD>.csv")
        return

    by_patient = {}
    for patient_key, date_part, path in parsed:
        by_patient.setdefault(patient_key, []).append((date_part, path))

    patient_keys = sorted(by_patient.keys())

    print(f"Found {len(parsed)} valid CSV files across {len(patient_keys)} patients")

    created_sessions = []
    total_imported_frames = 0

    for patient_idx, patient_key in enumerate(patient_keys, start=1):
        user, profile = get_or_create_patient(patient_key, patient_idx)

        files = sorted(by_patient[patient_key], key=lambda item: item[0])
        for session_index, (date_part, csv_path) in enumerate(files, start=1):
            session_date = make_session_datetime(date_part, session_index)
            session, frames = import_one_session(profile, csv_path, session_date)
            total_imported_frames += frames
            created_sessions.append((user.email, session.id, csv_path.name, frames))

    print("\nImport complete.")
    print(f"Patients mapped: {len(patient_keys)}")
    print(f"Sessions created: {len(created_sessions)}")
    print(f"Total frames imported: {total_imported_frames}")
    print(f"Seeded patient password: {SEED_PASSWORD}")
    print("\nSession mapping:")
    for email, session_id, source_file, frames in created_sessions:
        print(f"  {email} -> session_id={session_id}, file={source_file}, frames={frames}")


main()
