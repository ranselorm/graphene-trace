from django.conf import settings
from django.db import models

# Create your models here.

class Patient(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="patient_profile")
    assigned_clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_patients",
        limit_choices_to={"role": "clinician"},
    )
    date_of_birth = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Patient({self.user.username})"