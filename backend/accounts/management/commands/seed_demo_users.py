from django.core.management.base import BaseCommand

from accounts.models import User
from clinicians.models import Clinician
from patients.models import PatientProfile


ADMIN_USER = {
    "email": "admin@example.com",
    "username": "admin",
    "full_name": "Admin User",
    "password": "admin123",
}

CLINICIANS = [
    {
        "email": "clinician1@example.com",
        "username": "clinician_1",
        "full_name": "Dr. Sarah Lane",
        "specialty": "Wound Care",
        "password": "clinician123",
    },
    {
        "email": "clinician2@example.com",
        "username": "clinician_2",
        "full_name": "Dr. Michael Reed",
        "specialty": "Rehabilitation",
        "password": "clinician123",
    },
    {
        "email": "clinician3@example.com",
        "username": "clinician_3",
        "full_name": "Dr. Nina Patel",
        "specialty": "Chronic Pain",
        "password": "clinician123",
    },
]

PATIENTS = [
    {
        "email": "1c0fd777@example.com",
        "username": "patient_1c0fd777",
        "full_name": "Patient A",
        "risk_category": "high",
        "password": "patient123",
    },
    {
        "email": "543d4676@example.com",
        "username": "patient_543d4676",
        "full_name": "Patient B",
        "risk_category": "medium",
        "password": "patient123",
    },
    {
        "email": "71e66ab3@example.com",
        "username": "patient_71e66ab3",
        "full_name": "Patient C",
        "risk_category": "low",
        "password": "patient123",
    },
    {
        "email": "d13043b3@example.com",
        "username": "patient_d13043b3",
        "full_name": "Patient D",
        "risk_category": "high",
        "password": "patient123",
    },
    {
        "email": "de0e9b2c@example.com",
        "username": "patient_de0e9b2c",
        "full_name": "Patient E",
        "risk_category": "medium",
        "password": "patient123",
    },
]


class Command(BaseCommand):
    help = "Create or update demo admin/clinician/patient users for local development"

    def handle(self, *args, **options):
        admin_user = self._upsert_admin(ADMIN_USER)
        clinicians = [self._upsert_clinician(item) for item in CLINICIANS]
        patients = [self._upsert_patient(item) for item in PATIENTS]

        for index, patient_profile in enumerate(patients):
            assigned = clinicians[index % len(clinicians)]
            if patient_profile.clinician_id != assigned.id:
                patient_profile.clinician = assigned
                patient_profile.save(update_fields=["clinician"])

        self.stdout.write(self.style.SUCCESS("Demo user seed complete."))
        self.stdout.write(f"admin={admin_user.email}")
        self.stdout.write(f"clinicians={User.objects.filter(role='clinician').count()}")
        self.stdout.write(f"patients={User.objects.filter(role='patient').count()}")

    def _upsert_admin(self, item):
        user, created = User.objects.get_or_create(
            email=item["email"],
            defaults={
                "username": item["username"],
                "full_name": item["full_name"],
                "role": "admin",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        user.username = item["username"]
        user.full_name = item["full_name"]
        user.role = "admin"
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(item["password"])
        user.save()

        verb = "CREATED" if created else "UPDATED"
        self.stdout.write(f"{verb} admin: {user.email}")
        return user

    def _upsert_clinician(self, item):
        user, created = User.objects.get_or_create(
            email=item["email"],
            defaults={
                "username": item["username"],
                "full_name": item["full_name"],
                "role": "clinician",
                "is_active": True,
            },
        )

        user.username = item["username"]
        user.full_name = item["full_name"]
        user.role = "clinician"
        user.is_active = True
        user.set_password(item["password"])
        user.save()

        profile, _ = Clinician.objects.get_or_create(
            user=user,
            defaults={"specialty": item["specialty"]},
        )
        profile.specialty = item["specialty"]
        profile.save(update_fields=["specialty"])

        verb = "CREATED" if created else "UPDATED"
        self.stdout.write(f"{verb} clinician: {user.email}")
        return user

    def _upsert_patient(self, item):
        user, created = User.objects.get_or_create(
            email=item["email"],
            defaults={
                "username": item["username"],
                "full_name": item["full_name"],
                "role": "patient",
                "is_active": True,
            },
        )

        user.username = item["username"]
        user.full_name = item["full_name"]
        user.role = "patient"
        user.is_active = True
        user.set_password(item["password"])
        user.save()

        profile, _ = PatientProfile.objects.get_or_create(patient=user)
        profile.risk_category = item["risk_category"]
        profile.save(update_fields=["risk_category"])

        verb = "CREATED" if created else "UPDATED"
        self.stdout.write(f"{verb} patient: {user.email}")
        return profile