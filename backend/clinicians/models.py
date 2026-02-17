from django.conf import settings
from django.db import models

# Create your models here.

class Clinician(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="clinician_profile")
    specialty = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Clinician({self.user.username})"