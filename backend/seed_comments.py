"""
Seed comments for local development.

Run:
  cd backend
  python manage.py shell < seed_comments.py
"""

from django.utils import timezone
from django.apps import apps

Comment = apps.get_model("comments", "Comment")
SensorFrame = apps.get_model("telemetry", "SensorFrame")
PatientProfile = apps.get_model("patients", "PatientProfile")
User = apps.get_model("accounts", "User")


def slugify_name(full_name: str):
    return (full_name or "user").strip().lower().replace(" ", "_")


def get_or_create_user(full_name: str, role: str, password: str):
    username = f"{slugify_name(full_name)}_{role}"
    email = f"{username}@example.com"

    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "username": username,
            "full_name": full_name,
            "role": role,
            "is_active": True,
        },
    )

    if hasattr(user, "full_name"):
        user.full_name = full_name
    if hasattr(user, "role"):
        user.role = role

    user.is_active = True
    user.set_password(password)
    user.save()
    return user


def get_or_create_patient_profile(patient_user):
    profile, _ = PatientProfile.objects.get_or_create(patient=patient_user)
    return profile


def get_or_create_sensor_frame(profile, ts, data):
    # Stable lookup for reruns: patient + timestamp
    frame, _ = SensorFrame.objects.get_or_create(
        patient=profile,
        timestamp=ts,
        defaults={"data": data},
    )
    # Ensure data is set even if it existed
    frame.data = data
    frame.save()
    return frame


def get_or_create_comment(frame, user, body, created_at=None):
    # Stable lookup for reruns: frame + user + body
    comment, created = Comment.objects.get_or_create(
        sensor_frame=frame,
        user=user,
        body=body,
    )

    # If your DB already has it, leave created_at alone (auto_now_add)
    # If you want to force times, you need a raw update. Keep it simple.
    return comment, created


patients = [
    "Amir Butti",
    "Oliver Pulley",
]

clinicians = [
    "Dr Mike Wilson",
]

now = timezone.now()

# Create users
patient_users = [get_or_create_user(name, "patient", "patient123") for name in patients]
clinician_users = [get_or_create_user(name, "clinician", "clinician123") for name in clinicians]

# Create profiles
profiles = [get_or_create_patient_profile(u) for u in patient_users]

# Create sensor frames (2 per patient)
frames = []
for idx, profile in enumerate(profiles):
    frames.append(
        get_or_create_sensor_frame(
            profile,
            ts=now.replace(microsecond=0) - timezone.timedelta(minutes=(idx + 1) * 10),
            data={"seed": True, "metrics": {"pressure": 80 + idx, "contact_area": 0.6 - (idx * 0.05)}},
        )
    )
    frames.append(
        get_or_create_sensor_frame(
            profile,
            ts=now.replace(microsecond=0) - timezone.timedelta(minutes=(idx + 1) * 18),
            data={"seed": True, "metrics": {"pressure": 75 + idx, "contact_area": 0.55 - (idx * 0.04)}},
        )
    )

# Seed comments
seed_comments = [
    # patient comments
    {"frame": frames[0], "user": patient_users[0], "body": "I felt discomfort around this time."},
    {"frame": frames[1], "user": patient_users[0], "body": "Is this reading normal?"},
    {"frame": frames[2], "user": patient_users[1], "body": "I adjusted the strap before this scan."},

    # clinician comments
    {"frame": frames[0], "user": clinician_users[0], "body": "Noted. Please keep posture steady during capture."},
    {"frame": frames[2], "user": clinician_users[0], "body": "Low contact area detected. Refit the sensor and retry."},
    {"frame": frames[3], "user": clinician_users[0], "body": "Trend looks stable. Continue monitoring."},
]

created = 0
updated = 0

for item in seed_comments:
    _, was_created = get_or_create_comment(item["frame"], item["user"], item["body"])
    if was_created:
        created += 1
    else:
        updated += 1

print(f"Seed complete. Created comments: {created}, Existing: {updated}, Total: {Comment.objects.count()}")
print("Seeded patient password: patient123")
print("Seeded clinician password: clinician123")