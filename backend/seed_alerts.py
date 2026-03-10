"""
Seed alerts for local development.

Run:
  cd backend
  python manage.py shell < seed_alerts.py
"""

import json
from datetime import timedelta
from django.utils import timezone
from django.apps import apps

Alert = apps.get_model("alerts", "Alert")
PatientProfile = apps.get_model("patients", "PatientProfile")
User = apps.get_model("accounts", "User")

latestAlerts = [
  {
    "patientName": "John Doe",
    "alertType": "high_pressure",
    "label": "High pressure",
    "severity": "high",
    "status": "new",
    "timestamp": "2 mins ago",
  },
  {
    "patientName": "Anna Lee",
    "alertType": "low_contact_area",
    "label": "Low contact area",
    "severity": "medium",
    "status": "reviewed",
    "timestamp": "25 mins ago",
  },
  {
    "patientName": "Mike Wilson",
    "alertType": "high_pressure",
    "label": "High pressure",
    "severity": "high",
    "status": "new",
    "timestamp": "1 hour ago",
  },
  {
    "patientName": "Jane Smith",
    "alertType": "low_contact_area",
    "label": "Low contact area",
    "severity": "low",
    "status": "resolved",
    "timestamp": "2 hours ago",
  },
]

def parse_relative_timestamp(s: str):
    s = (s or "").lower().strip()
    now = timezone.now()
    if "min" in s:
        return now - timedelta(minutes=int(s.split()[0]))
    if "hour" in s:
        return now - timedelta(hours=int(s.split()[0]))
    if "day" in s:
        return now - timedelta(days=int(s.split()[0]))
    return now

def slugify_name(full_name: str):
    return (full_name or "patient").strip().lower().replace(" ", "_")

def get_or_create_patient_user(full_name: str):
    username = slugify_name(full_name)
    email = f"{username}@example.com"

    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "username": username,
            "full_name": full_name,
            "role": "patient",
            "is_active": True,
        },
    )

    if hasattr(user, "full_name"):
        user.full_name = full_name
    if hasattr(user, "role"):
        user.role = "patient"

    user.is_active = True
    user.set_password("patient123")
    user.save()
    return user

def get_or_create_profile(user):
    profile, _ = PatientProfile.objects.get_or_create(patient=user)
    return profile

def get_sensor_frame_model():
    # Alert.sensor_frame -> telemetry.SensorFrame
    f = Alert._meta.get_field("sensor_frame")
    return f.remote_field.model

def create_min_sensor_frame(SensorFrame, profile, at_dt):
    fields = {f.name for f in SensorFrame._meta.fields}
    now = timezone.now()
    kwargs = {}

    # Link to patient/profile if such a field exists on SensorFrame
    if "patient" in fields:
        kwargs["patient"] = profile
    elif "patient_profile" in fields:
        kwargs["patient_profile"] = profile
    elif "profile" in fields:
        kwargs["profile"] = profile

    # Required fields discovered from your errors
    if "timestamp" in fields:
        kwargs["timestamp"] = at_dt or now

    if "data" in fields:
        kwargs["data"] = {
            "seed": True,
            "metrics": {
                "pressure": 78,
                "contact_area": 0.62,
            },
            "note": "seeded sensor frame",
        }

    # Optional audit fields if present
    if "created_at" in fields:
        kwargs["created_at"] = now
    if "updated_at" in fields:
        kwargs["updated_at"] = now

    # If data is not a JSONField, store it as a string
    try:
        return SensorFrame.objects.create(**kwargs)
    except Exception:
        if "data" in kwargs and not isinstance(kwargs["data"], str):
            kwargs["data"] = json.dumps(kwargs["data"])
        return SensorFrame.objects.create(**kwargs)

SensorFrame = get_sensor_frame_model()
print("Alert.sensor_frame points to:", SensorFrame._meta.label)

created = 0

for item in latestAlerts:
    at_dt = parse_relative_timestamp(item["timestamp"])

    user = get_or_create_patient_user(item["patientName"])
    profile = get_or_create_profile(user)

    frame = create_min_sensor_frame(SensorFrame, profile, at_dt)

    Alert.objects.create(
        patient=profile,
        sensor_frame=frame,
        alert_type=item["alertType"],
        severity=item["severity"],
        status=item["status"],
        created_at=at_dt,
    )
    created += 1

print(f"Seed complete. Created alerts: {created}. Total alerts: {Alert.objects.count()}")
print("Seeded patient password for all patients: patient123")